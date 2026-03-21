"""
orchestrator.py — LangGraph Multi-Agent Debate Orchestrator for LOKSETU
Models: Amazon Bedrock (Nova Lite, Nova Pro, Mistral Large — no Claude)
Tools: Real FAISS RAG retrieval from 3 Chandigarh knowledge base documents
"""
import os
import json
import asyncio
import re
import boto3
from typing import TypedDict
from datetime import datetime
from pathlib import Path

import motor.motor_asyncio
from bson import ObjectId
from langgraph.graph import StateGraph, START, END
from dotenv import load_dotenv

# Try loading FAISS + embeddings (graceful fallback if not ready)
_rag_ready = False
_vector_store = None

load_dotenv(Path(__file__).parent / ".env")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyBtfybE6blmH9fpUrWhr4FrXeU-ok0fiTo")
VECTOR_STORE_PATH = str(Path(__file__).parent / "vector_store")

def _load_vector_store():
    global _rag_ready, _vector_store
    try:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        from langchain_community.vectorstores import FAISS
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=GEMINI_API_KEY
        )
        _vector_store = FAISS.load_local(
            VECTOR_STORE_PATH,
            embeddings,
            allow_dangerous_deserialization=True
        )
        _rag_ready = True
        print("✅ FAISS vector store loaded. RAG tools are ready.")
    except Exception as e:
        print(f"⚠️  Vector store not loaded — run ingest_docs.py first. ({e})")

_load_vector_store()

# -----------------------------------------------------------------------
# Bedrock Setup
# -----------------------------------------------------------------------
bedrock_client = boto3.client(
    service_name='bedrock-runtime',
    region_name=os.environ.get('AWS_REGION', 'us-east-1')
)

# -----------------------------------------------------------------------
# MongoDB Setup
# -----------------------------------------------------------------------
MONGO_URL = os.environ.get("DATABASE_URL", "mongodb://localhost:27017/loksetu")
db_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = db_client.get_default_database()
debate_logs_collection = db["DebateLog"]
complaints_collection = db["Complaint"]
departments_collection = db["Department"]

# -----------------------------------------------------------------------
# Model Pool — Only confirmed-working Bedrock models (no Claude)
# -----------------------------------------------------------------------
AVAILABLE_MODELS = {
    "Nova":    "amazon.nova-lite-v1:0",
    "NovaPro": "amazon.nova-pro-v1:0",
    "Mistral": "mistral.mistral-large-2402-v1:0",
}

# -----------------------------------------------------------------------
# FAISS RAG Tool Functions
# Agents call: [TOOL: rag_bylaws("query")]  etc.
# -----------------------------------------------------------------------

def _rag_search(query: str, source_filter: str | None = None, k: int = 4) -> str:
    """Core semantic search against the FAISS vector store."""
    if not _rag_ready or _vector_store is None:
        return "[RAG NOT READY] Run python ingest_docs.py first to build the vector store."
    try:
        if source_filter:
            # Use similarity_search_with_score and filter manually
            results = _vector_store.similarity_search(query, k=k * 2)
            results = [r for r in results if source_filter.lower() in r.metadata.get("source", "").lower()][:k]
        else:
            results = _vector_store.similarity_search(query, k=k)

        if not results:
            return f"No relevant documents found for: '{query}'"

        snippets = []
        for i, doc in enumerate(results, 1):
            src = doc.metadata.get("source", "Unknown")
            content = doc.page_content[:400].replace("\n", " ").strip()
            snippets.append(f"[{i}] [{src}]: {content}...")

        return "\n".join(snippets)
    except Exception as e:
        return f"RAG Search Error: {e}"

async def tool_rag_bylaws(query: str = "") -> str:
    """Searches the Municipal Bylaws & Acts document for policy clauses and section references."""
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, _rag_search, query, "Municipal Bylaws")
    return f"[Municipal Bylaws Lookup]\n{result}"

async def tool_rag_sops(query: str = "") -> str:
    """Searches the PWD & Public Health SOPs document for SLA timelines and operational procedures."""
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, _rag_search, query, "PWD")
    return f"[PWD & SOPs Lookup]\n{result}"

async def tool_rag_schemes(query: str = "") -> str:
    """Searches the Govt Schemes & RTI Guidelines for citizen entitlements and application procedures."""
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, _rag_search, query, "Govt Schemes")
    return f"[Schemes & RTI Lookup]\n{result}"

async def tool_search_sector_history(query: str = "") -> str:
    """Queries MongoDB complaint history to find recurring patterns and category trends."""
    try:
        pipeline = [
            {"$match": {"status": {"$in": ["RESOLVED", "CLOSED"]}}},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        cursor = complaints_collection.aggregate(pipeline)
        results = await cursor.to_list(length=10)
        if not results:
            return "No historical patterns found in DB."
        summary = ", ".join([f"{r['_id']} ({r['count']} cases)" for r in results if r.get('_id')])
        return f"Historical DB Lookup: Top resolved complaint categories city-wide: {summary}"
    except Exception as e:
        return f"DB Lookup Error: {e}"

async def tool_fetch_department(dept_name: str = "") -> str:
    """Looks up the correct CMC department from the City Directory for routing."""
    try:
        dept = await departments_collection.find_one({"name": {"$regex": dept_name, "$options": "i"}})
        if dept:
            return f"Department Match: '{dept.get('name')}'. Wing: {dept.get('description', 'N/A')}. Auto-assign to this department."
        else:
            # Fuzzy: list available departments
            all_depts = await departments_collection.find({}, {"name": 1}).to_list(length=20)
            names = [d.get("name") for d in all_depts if d.get("name")]
            return f"No exact match for '{dept_name}'. Available departments: {', '.join(names[:10])}."
    except Exception as e:
        return f"Department Lookup Error: {e}"

async def tool_classify_urgency(description: str = "") -> str:
    """Scores the urgency of the complaint from 1-10 using keyword heuristics and the SOP doc guidelines."""
    urgency_keywords = {
        "death": 10, "fire": 10, "flood": 9, "collapse": 10,
        "sewage overflow": 9, "contaminated water": 9, "injury": 9,
        "pothole": 5, "streetlight": 4, "noise": 3, "garbage": 5,
        "hospital": 9, "water supply": 7, "electricity": 7, "stray animal": 6,
        "encroachment": 6, "waterlogging": 7, "road damage": 6,
    }
    desc_lower = description.lower()
    score = 3
    matched = []
    for keyword, weight in urgency_keywords.items():
        if keyword in desc_lower:
            score = max(score, weight)
            matched.append(keyword)
    
    # Also do a quick RAG lookup for SOP guidance
    sop_hint = ""
    if _rag_ready:
        sop_result = await tool_rag_sops(f"SLA timeline for: {description[:100]}")
        sop_hint = f" SOP Ref: {sop_result[:200]}"
    
    return f"Urgency Score: {score}/10. Matched keywords: {matched if matched else 'none'}.{sop_hint}"

# Tool registry for dispatch
TOOL_REGISTRY = {
    "rag_bylaws":            tool_rag_bylaws,
    "rag_sops":              tool_rag_sops,
    "rag_schemes":           tool_rag_schemes,
    "search_sector_history": tool_search_sector_history,
    "fetch_department":      tool_fetch_department,
    "classify_urgency":      tool_classify_urgency,
}

async def execute_tool_calls(response_text: str, context: dict) -> str:
    """Scans agent output for [TOOL: name("arg")] patterns, executes them, appends results."""
    tool_call_pattern = re.compile(r'\[TOOL:\s*(\w+)\("?([^")]*)"?\)\]')
    matches = tool_call_pattern.findall(response_text)

    tool_results = []
    for tool_name, raw_arg in matches:
        tool_fn = TOOL_REGISTRY.get(tool_name)
        if tool_fn:
            try:
                arg = raw_arg.strip() or context.get('description', '')[:200]
                result = await tool_fn(arg)
                tool_results.append(f"\n  ↳ [TOOL: {tool_name}] → {result}")
            except Exception as e:
                tool_results.append(f"\n  ↳ [TOOL ERROR: {tool_name}] → {e}")
        else:
            tool_results.append(f"\n  ↳ [UNKNOWN TOOL: {tool_name}]")

    if tool_results:
        response_text += "\n" + "".join(tool_results)
    return response_text

# -----------------------------------------------------------------------
# Bedrock Invocation with 3-tier fallback
# -----------------------------------------------------------------------
def invoke_bedrock(model_id: str, system_prompt: str, user_prompt: str) -> str:
    messages = [{"role": "user", "content": [{"text": user_prompt}]}]
    system_prompts = [{"text": system_prompt}]
    try:
        response = bedrock_client.converse(
            modelId=model_id,
            messages=messages,
            system=system_prompts,
            inferenceConfig={"temperature": 0.7, "maxTokens": 700}
        )
        return response['output']['message']['content'][0]['text']
    except Exception as e:
        print(f"Bedrock Error with {model_id}: {e}")
        fallbacks = [AVAILABLE_MODELS["NovaPro"], AVAILABLE_MODELS["Nova"], AVAILABLE_MODELS["Mistral"]]
        for fb in fallbacks:
            if fb != model_id:
                try:
                    resp = bedrock_client.converse(
                        modelId=fb, messages=messages, system=system_prompts,
                        inferenceConfig={"temperature": 0.7, "maxTokens": 700}
                    )
                    return resp['output']['message']['content'][0]['text']
                except Exception as e2:
                    print(f"  Fallback {fb} also failed: {e2}")
        return "All model invocations failed."

async def log_debate_to_db(complaint_id: str, agent_name: str, message: str, meta_data: str = ""):
    if not complaint_id:
        return
    try:
        await debate_logs_collection.insert_one({
            "complaintId": ObjectId(complaint_id),
            "agentName": agent_name,
            "message": message,
            "metadata": meta_data,
            "createdAt": datetime.utcnow()
        })
    except Exception as e:
        print(f"DB Log Error: {e}")

# -----------------------------------------------------------------------
# Graph State
# -----------------------------------------------------------------------
class GraphState(TypedDict):
    complaint_id: str
    title: str
    description: str
    policy_review: str
    evidence_review: str
    citizen_advocate: str
    skeptic_notes: str
    final_decision: str
    final_status: str

# -----------------------------------------------------------------------
# Agent Tool Instructions (injected into every system prompt)
# -----------------------------------------------------------------------
TOOL_INSTRUCTIONS = """
You have access to the following tools. Call them by including exactly this syntax in your response:
  [TOOL: rag_bylaws("your query")] — Search the Chandigarh Municipal Bylaws & Acts for policy/legal precedent
  [TOOL: rag_sops("your query")]   — Search PWD & Public Health SOPs for SLA timelines and procedures
  [TOOL: classify_urgency("complaint text")] — Get an urgency score 1-10 with SOP cross-reference
  [TOOL: search_sector_history("category")] — Check MongoDB for recurring complaint patterns city-wide
  [TOOL: fetch_department("department name")] — Look up the correct CMC department for routing

Use 1-2 tools where they genuinely improve your analysis. Tools return real data from the knowledge base.
"""

# -----------------------------------------------------------------------
# Agent Nodes
# -----------------------------------------------------------------------
async def policy_enforcer(state: GraphState):
    agent_name = "Policy Enforcer"
    sys_prompt = f"""You are the Policy Enforcer for Chandigarh Municipal Corporation (CMC).
Your job: Cross-reference this complaint with local bylaws and call the rag_bylaws tool to find relevant sections.
Also call classify_urgency to assess severity.
Provide a 3-sentence legal/policy opinion citing any relevant bylaw sections found.
{TOOL_INSTRUCTIONS}"""
    user_prompt = f"Complaint Title: {state.get('title')}\nDescription: {state.get('description')}"

    loop = asyncio.get_running_loop()
    response_text = await loop.run_in_executor(None, invoke_bedrock, AVAILABLE_MODELS["Mistral"], sys_prompt, user_prompt)
    response_text = await execute_tool_calls(response_text, {"description": state.get('description', '')})

    await log_debate_to_db(str(state.get('complaint_id', '')), agent_name, response_text)
    return {"policy_review": response_text}

async def evidence_reviewer(state: GraphState):
    agent_name = "Evidence & Context Reviewer"
    sys_prompt = f"""You are the Evidence Reviewer for LOKSETU.
Your job: Evaluate the physical context and SLA compliance.
Call rag_sops to find the SLA timeline for this type of issue.
Call search_sector_history to check if this is a recurring problem.
Keep your analysis concise (3 sentences max).
{TOOL_INSTRUCTIONS}"""
    user_prompt = f"Complaint Title: {state.get('title')}\nDescription: {state.get('description')}"

    loop = asyncio.get_running_loop()
    response_text = await loop.run_in_executor(None, invoke_bedrock, AVAILABLE_MODELS["Nova"], sys_prompt, user_prompt)
    response_text = await execute_tool_calls(response_text, {"description": state.get('description', '')})

    await log_debate_to_db(str(state.get('complaint_id', '')), agent_name, response_text)
    return {"evidence_review": response_text}

async def citizen_advocate(state: GraphState):
    agent_name = "Citizen Advocate"
    sys_prompt = f"""You are the Citizen Advocate for LOKSETU.
Your job: Argue for the citizen's relief using rag_schemes to determine if they are entitled to any scheme benefits or RTI rights.
Also call fetch_department to identify the correct department for resolution.
Make a strong, empathetic case in 3 sentences.
{TOOL_INSTRUCTIONS}"""
    user_prompt = f"Complaint Title: {state.get('title')}\nDescription: {state.get('description')}"

    loop = asyncio.get_running_loop()
    response_text = await loop.run_in_executor(None, invoke_bedrock, AVAILABLE_MODELS["NovaPro"], sys_prompt, user_prompt)
    response_text = await execute_tool_calls(response_text, {"description": state.get('description', '')})

    await log_debate_to_db(str(state.get('complaint_id', '')), agent_name, response_text)
    return {"citizen_advocate": response_text}

async def skeptic(state: GraphState):
    agent_name = "Devil's Advocate"
    sys_prompt = f"""You are the Skeptic for LOKSETU. Stress-test the complaint before CMC acts.
Call rag_bylaws to check if the citizen's issue is actually within municipal jurisdiction or a private matter.
Call search_sector_history to check if this might be a pattern of frivolous complaints.
Be concise but pointed (2 sentences).
{TOOL_INSTRUCTIONS}"""
    user_prompt = (
        f"Title: {state.get('title')}\nDescription: {state.get('description')}\n"
        f"Policy view: {state.get('policy_review', '')[:400]}\n"
        f"Advocate view: {state.get('citizen_advocate', '')[:400]}"
    )

    loop = asyncio.get_running_loop()
    response_text = await loop.run_in_executor(None, invoke_bedrock, AVAILABLE_MODELS["Mistral"], sys_prompt, user_prompt)
    response_text = await execute_tool_calls(response_text, {"description": state.get('description', '')})

    await log_debate_to_db(str(state.get('complaint_id', '')), agent_name, response_text)
    return {"skeptic_notes": response_text}

async def chief_coordinator_end(state: GraphState):
    agent_name = "Chief Coordinator"
    sys_prompt = """You are the Chief Coordinator of Chandigarh's Grievance Cell.
Read all agent inputs and make a final, binding decision.
Use fetch_department to confirm the correct department name for the "assigned_department" field.

Output ONLY valid JSON. No preamble or extra text:
{
  "final_status": "NEEDS_INFO" | "ESCALATED" | "ASSIGNED" | "REJECTED",
  "reasoning": "Exactly one sentence explaining the ruling.",
  "assigned_department": "Exact department name from City Directory, or null"
}"""

    user_prompt = (
        f"Title: {state.get('title')}\nDescription: {state.get('description')}\n\n"
        f"=== Policy Enforcer ===\n{state.get('policy_review', 'N/A')[:500]}\n\n"
        f"=== Evidence Reviewer ===\n{state.get('evidence_review', 'N/A')[:500]}\n\n"
        f"=== Citizen Advocate ===\n{state.get('citizen_advocate', 'N/A')[:500]}\n\n"
        f"=== Skeptic ===\n{state.get('skeptic_notes', 'N/A')[:500]}"
    )

    loop = asyncio.get_running_loop()
    response_text = await loop.run_in_executor(None, invoke_bedrock, AVAILABLE_MODELS["NovaPro"], sys_prompt, user_prompt)
    response_text = await execute_tool_calls(response_text, {"description": state.get('description', '')})
    await log_debate_to_db(str(state.get('complaint_id', '')), agent_name, response_text)

    # Parse JSON
    match = re.search(r'\{[\s\S]*?\}', response_text)
    final_status = "ASSIGNED"
    reasoning = response_text
    assigned_dept = None
    if match:
        try:
            parsed = json.loads(match.group(0))
            final_status = parsed.get("final_status", "ASSIGNED")
            reasoning = parsed.get("reasoning", reasoning)
            assigned_dept = parsed.get("assigned_department")
        except Exception:
            pass

    # Update MongoDB complaint
    if state.get('complaint_id'):
        try:
            update_fields: dict = {"status": final_status}
            if assigned_dept:
                dept_doc = await departments_collection.find_one(
                    {"name": {"$regex": assigned_dept, "$options": "i"}}
                )
                if dept_doc:
                    update_fields["departmentId"] = dept_doc["_id"]
            await complaints_collection.update_one(
                {"_id": ObjectId(state.get('complaint_id'))},
                {"$set": update_fields}
            )
        except Exception as e:
            print("DB update error:", e)

    return {"final_decision": reasoning, "final_status": final_status}

# -----------------------------------------------------------------------
# Compile LangGraph Workflow
# -----------------------------------------------------------------------
workflow = StateGraph(GraphState)

workflow.add_node("policy_enforcer",       policy_enforcer)
workflow.add_node("evidence_reviewer",     evidence_reviewer)
workflow.add_node("citizen_advocate",      citizen_advocate)
workflow.add_node("skeptic",               skeptic)
workflow.add_node("chief_coordinator_end", chief_coordinator_end)

workflow.add_edge(START, "policy_enforcer")
workflow.add_edge(START, "evidence_reviewer")
workflow.add_edge(START, "citizen_advocate")

workflow.add_edge("policy_enforcer",   "skeptic")
workflow.add_edge("citizen_advocate",  "skeptic")

workflow.add_edge("evidence_reviewer",     "chief_coordinator_end")
workflow.add_edge("skeptic",               "chief_coordinator_end")
workflow.add_edge("chief_coordinator_end", END)

app_graph = workflow.compile()

async def run_orchestration_workflow(complaint_id: str, title: str, description: str):
    result = await app_graph.ainvoke({
        "complaint_id": complaint_id,
        "title": title,
        "description": description,
    })
    return {
        "final_decision": result.get("final_decision"),
        "final_status":   result.get("final_status"),
        "perspectives": {
            "policy":   result.get("policy_review"),
            "evidence": result.get("evidence_review"),
            "advocate": result.get("citizen_advocate"),
            "skeptic":  result.get("skeptic_notes"),
        }
    }
