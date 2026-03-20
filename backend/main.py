import os
from typing import Dict, TypedDict
from fastapi import FastAPI
from pydantic import BaseModel
from langchain_aws import ChatBedrock
from langgraph.graph import StateGraph, START, END

app = FastAPI()

# LLM init
# NOTE: Ensure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION are in your environment
# If not present, we will fallback to a DummyLLM for testing.

class DummyLLM:
    def invoke(self, prompt: str):
        class Response:
            content = "This is a simulated AI response based on: " + prompt[:30] + "..."
        return Response()

def get_llm():
    try:
        if os.getenv("AWS_ACCESS_KEY_ID") or os.getenv("AWS_BEARER_TOKEN_BEDROCK"):
            return ChatBedrock(
                model_id="anthropic.claude-3-5-sonnet-20240620-v1:0", 
                region_name=os.getenv("AWS_REGION", "us-east-1")
            )
    except Exception as e:
        print("Could not initialize Bedrock. Falling back to DummyLLM. Error:", e)
    return DummyLLM()

llm = get_llm()

class GraphState(TypedDict):
    title: str
    description: str
    policy_review: str
    evidence_review: str
    citizen_advocate: str
    skeptic_notes: str
    final_decision: str

def policy_enforcer(state: GraphState):
    prompt = f"Review this complaint for city policy compliance. Title: {state.get('title')} Description: {state.get('description')}\nProvide a concise 2-sentence policy review."
    response = llm.invoke(prompt)
    return {"policy_review": response.content}

def evidence_reviewer(state: GraphState):
    prompt = f"Analyze if this complaint has sufficient evidence or operational details. Title: {state.get('title')} Description: {state.get('description')}\nProvide a concise 2-sentence evidence review."
    response = llm.invoke(prompt)
    return {"evidence_review": response.content}

def citizen_advocate(state: GraphState):
    prompt = f"Argue for the citizen's perspective and needs based on this complaint. Title: {state.get('title')} Description: {state.get('description')}\nProvide a concise 2-sentence advocacy statement."
    response = llm.invoke(prompt)
    return {"citizen_advocate": response.content}

def skeptic(state: GraphState):
    prompt = f"Provide a skeptical view of this complaint. Find edge cases or missing details. Title: {state.get('title')} Description: {state.get('description')}\nProvide a concise 2-sentence skeptical review."
    response = llm.invoke(prompt)
    return {"skeptic_notes": response.content}

def chief_coordinator_end(state: GraphState):
    prompt = f"""
    You are the Chief Coordinator of the city council. Combine the perspectives into a final brief summary and action plan.
    Complaint Title: {state.get('title')}
    Description: {state.get('description')}
    
    Perspectives:
    Policy Review: {state.get('policy_review')}
    Evidence Review: {state.get('evidence_review')}
    Advocate: {state.get('citizen_advocate')}
    Skeptic: {state.get('skeptic_notes')}
    
    Provide a final short summary and action plan for the department.
    """
    response = llm.invoke(prompt)
    return {"final_decision": response.content}

# Multi-Agent Workflow
workflow = StateGraph(GraphState)

workflow.add_node("policy_enforcer", policy_enforcer)
workflow.add_node("evidence_reviewer", evidence_reviewer)
workflow.add_node("citizen_advocate", citizen_advocate)
workflow.add_node("skeptic", skeptic)
workflow.add_node("chief_coordinator_end", chief_coordinator_end)

# Start routes to all individual agent reviewers parallelly
workflow.add_edge(START, "policy_enforcer")
workflow.add_edge(START, "evidence_reviewer")
workflow.add_edge(START, "citizen_advocate")
workflow.add_edge(START, "skeptic")

# Reviews converge into the chief coordinator
workflow.add_edge("policy_enforcer", "chief_coordinator_end")
workflow.add_edge("evidence_reviewer", "chief_coordinator_end")
workflow.add_edge("citizen_advocate", "chief_coordinator_end")
workflow.add_edge("skeptic", "chief_coordinator_end")

workflow.add_edge("chief_coordinator_end", END)

app_graph = workflow.compile()

class ComplaintRequest(BaseModel):
    title: str
    description: str

@app.post("/orchestrate")
async def run_orchestration(req: ComplaintRequest):
    initial_state = {
        "title": req.title,
        "description": req.description,
    }
    # Invoke the graph synchronously
    result = app_graph.invoke(initial_state)
    return {
        "final_decision": result.get("final_decision"),
        "perspectives": {
            "policy": result.get("policy_review"),
            "evidence": result.get("evidence_review"),
            "advocate": result.get("citizen_advocate"),
            "skeptic": result.get("skeptic_notes"),
        }
    }

@app.get("/")
def health_check():
    return {"status": "ok", "service": "LangGraph Orchestrator"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
