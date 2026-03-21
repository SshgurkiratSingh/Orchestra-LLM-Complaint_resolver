import base64
from langgraph.graph import StateGraph, START, END
import boto3
from pydantic import BaseModel
import asyncio
import json
from fastapi.responses import StreamingResponse, PlainTextResponse
from fastapi import FastAPI, Request
from typing import Dict, TypedDict
import os
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

# LLM init
# NOTE: Ensure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION are in your environment
# If not present, we will fallback to a DummyLLM for testing.


class DummyLLM:
    def invoke(self, prompt: str):
        class Response:
            content = "This is a simulated AI response based on: " + \
                prompt[:30] + "..."
        return Response()


class Boto3BedrockLLM:
    def __init__(self, model_id, region_name):
        self.model_id = model_id
        if os.getenv("AWS_ACCESS_KEY_ID") or os.getenv("AWS_BEARER_TOKEN_BEDROCK"):
            self.client = boto3.client(
                'bedrock-runtime', region_name=region_name)

            bearer_token = os.getenv("AWS_BEARER_TOKEN_BEDROCK")
            if bearer_token:
                def inject_bearer(request, **kwargs):
                    request.headers['Authorization'] = f"Bearer {bearer_token}"
                self.client.meta.events.register(
                    'before-send.bedrock-runtime.*', inject_bearer)
        else:
            self.client = None

    def invoke(self, prompt: str):
        if not self.client:
            return DummyLLM().invoke(prompt)
        try:
            messages = [{"role": "user", "content": [{"text": prompt}]}]
            response = self.client.converse(
                modelId=self.model_id,
                messages=messages,
                inferenceConfig={"maxTokens": 1024, "temperature": 0.7}
            )

            class Response:
                content = response['output']['message']['content'][0]['text']
            return Response()
        except Exception as e:
            print("Error in Boto3BedrockLLM.invoke:", e)
            return DummyLLM().invoke(prompt)

    def stream(self, lc_messages):
        if not self.client:
            prompt = str(lc_messages[-1]) if lc_messages else ""
            words = DummyLLM().invoke(prompt).content.split()
            for word in words:
                class Chunk:
                    content = word + " "
                yield Chunk()
            return

        try:
            messages = []
            system_prompts = []
            has_image = False
            for m in lc_messages:
                m_type = m.type if hasattr(m, 'type') else (
                    m['role'] if isinstance(m, dict) else 'user')
                content = m.content if hasattr(m, 'content') else (
                    m['content'] if isinstance(m, dict) else str(m))
                if m_type == "system":
                    system_prompts.append({"text": content})
                    continue
                role = "user" if m_type in ("human", "user") else "assistant"

                content_blocks = [{"text": content}]

                # Check for Vercel AI SDK experimental_attachments
                if isinstance(m, dict) and "experimental_attachments" in m:
                    for att in m["experimental_attachments"]:
                        url = att.get("url", "")
                        if url.startswith("data:image"):
                            try:
                                header, b64_data = url.split(',', 1)
                                mime_type = header.split(':')[1].split(';')[0]
                                img_format = mime_type.split('/')[1]
                                if img_format == 'jpg':
                                    img_format = 'jpeg'
                                img_bytes = base64.b64decode(b64_data)
                                content_blocks.append({
                                    "image": {
                                        "format": img_format,
                                        "source": {"bytes": img_bytes}
                                    }
                                })
                                has_image = True
                            except Exception as e:
                                print("Error parsing attachment:", e)

                messages.append({"role": role, "content": content_blocks})

            # Note: mistral-7b does not support multi-modal image inputs natively on Bedrock.
            # If an image is detected, we automatically pivot to Claude 3 Haiku for this request
            # to prevent a ValidationException, otherwise use the initialized Mistral model.
            active_model_id = "anthropic.claude-3-haiku-20240307-v1:0" if has_image else self.model_id

            # Bedrock mistral-7b v0 doesn't support 'system' block in Converse. Move system prompts to user block
            if "mistral" in active_model_id.lower() and system_prompts:
                system_text = "\\n".join([sp["text"] for sp in system_prompts])
                if messages and messages[0]["role"] == "user":
                    messages[0]["content"].insert(
                        0, {"text": "System Role / Instructions:\\n" + system_text + "\\n\\n"})
                else:
                    messages.insert(0, {"role": "user", "content": [
                                    {"text": "System Role / Instructions:\\n" + system_text + "\\n\\n"}]})
                system_prompts = []

            kwargs = {
                "modelId": active_model_id,
                "messages": messages,
                "inferenceConfig": {"maxTokens": 1024, "temperature": 0.7}
            }
            if system_prompts:
                kwargs["system"] = system_prompts

            response = self.client.converse_stream(**kwargs)
            for event in response.get('stream'):
                if 'contentBlockDelta' in event:
                    delta = event['contentBlockDelta']['delta']
                    if 'text' in delta:
                        class Chunk:
                            content = delta['text']
                        yield Chunk()
        except Exception as e:
            print("Error in Boto3BedrockLLM.stream:", e)

            class Chunk:
                content = f"Error during streaming: {str(e)}"
            yield Chunk()


def get_llm():
    try:
        if os.getenv("AWS_ACCESS_KEY_ID") or os.getenv("AWS_BEARER_TOKEN_BEDROCK"):
            return Boto3BedrockLLM(
                model_id="mistral.mistral-7b-instruct-v0:2",
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


@app.post("/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    messages = data.get("messages", [])
    language = data.get("language", "English")

    system_prompt = {
        "role": "system",
        "content": f"You are a city governance assistant for Chandigarh helping a user file a complaint. "
                   f"The user prefers to speak in {language}. You must reply back in {language} for conversational fields, but keep standard JSON keys in English. "
                   "You MUST ALWAYS respond with a raw JSON object containing exactly these keys: "
                   "`title` (short string), "
                   "`description` (detailed string summarizing the facts), "
                   "`type` (a string classification), "
                   "`location` (extracted address or coordinates, or empty string), "
                   "`date` (extracted incident date or time, or empty string), "
                   "`department` (e.g. Police, PWD, Health, Transport, or empty string), "
                   "`reply` (your conversational response to the user asking for missing info or confirming details), "
                   "and `suggested_action` (use 'REQUEST_LOCATION' if you need an address, 'REQUEST_IMAGE' if you want a photo, 'REQUEST_DATE' if you need an incident date, else 'NONE'). "
                   "Ensure the JSON is valid and do not write anything else outside the JSON."
    }
    # Ensure system prompt is first
    messages.insert(0, system_prompt)

    # Note: Vercel useChat expects a stream, but we can stream the entire JSON string in one go.
    async def generate():
        try:
            # We don't stream chunks anymore, we invoke and send the full string immediately
            # Convert system messages for Mistral or Claude.
            messages_for_invoke = []
            system_prompts = []
            has_image = False
            for m in messages:
                m_type = m.get('role', 'user')
                content = m.get('content', '')
                if m_type == "system":
                    system_prompts.append({"text": content})
                    continue

                content_blocks = [{"text": content}]

                # Check for Vercel AI SDK experimental_attachments
                if isinstance(m, dict) and "experimental_attachments" in m:
                    for att in m["experimental_attachments"]:
                        url = att.get("url", "")
                        if url.startswith("data:image"):
                            try:
                                header, b64_data = url.split(',', 1)
                                mime_type = header.split(':')[1].split(';')[0]
                                img_format = mime_type.split('/')[1]
                                if img_format == 'jpg':
                                    img_format = 'jpeg'
                                img_bytes = base64.b64decode(b64_data)
                                content_blocks.append({
                                    "image": {
                                        "format": img_format,
                                        "source": {"bytes": img_bytes}
                                    }
                                })
                                has_image = True
                            except Exception as e:
                                print("Error parsing attachment:", e)

                messages_for_invoke.append({"role": m_type if m_type in (
                    "user", "assistant") else "user", "content": content_blocks})

            active_model_id = "us.meta.llama3-2-11b-instruct-v1:0" if has_image else llm.model_id

            if "mistral" in active_model_id.lower() and system_prompts:
                system_text = "\\n".join([sp["text"] for sp in system_prompts])
                if messages_for_invoke and messages_for_invoke[0]["role"] == "user":
                    messages_for_invoke[0]["content"].insert(
                        0, {"text": "System Role / Instructions:\\n" + system_text + "\\n\\n"})
                else:
                    messages_for_invoke.insert(0, {"role": "user", "content": [
                                               {"text": "System Role / Instructions:\\n" + system_text + "\\n\\n"}]})
                system_prompts = []

            kwargs = {
                "modelId": active_model_id,
                "messages": messages_for_invoke,
                "inferenceConfig": {"maxTokens": 1024, "temperature": 0.7}
            }
            if system_prompts:
                kwargs["system"] = system_prompts

            response = llm.client.converse(**kwargs)
            full_text = response['output']['message']['content'][0]['text']

            import re
            match = re.search(r'\{[\s\S]*\}', full_text)
            if match:
                full_text = match.group(0)

            # Send the raw JSON string directly
            yield full_text

        except Exception as e:
            error_message = f"Error during single execution: {str(e)}"
            print(error_message)
            yield f'3:{json.dumps(error_message)}\\n'

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")

@app.post("/vision")
async def vision_endpoint(request: Request):
    data = await request.json()
    image = data.get("image")
    if not image:
        return {}

    prompt = {
        "role": "user",
        "content": [
            {"text": "Analyze this civic issue image. Respond ONLY with a raw JSON object containing these keys: `title` (short title of the issue), `type` (suggested category based on image, e.g. Roads, Sanitation, etc), and `description` (short summary of what is seen)."}
        ]
    }
    
    try:
        header, b64_data = image.split(',', 1)
        mime_type = header.split(':')[1].split(';')[0]
        img_format = mime_type.split('/')[1]
        if img_format == 'jpg':
            img_format = 'jpeg'
        import base64
        img_bytes = base64.b64decode(b64_data)
        prompt["content"].append({
            "image": {
                "format": img_format,
                "source": {"bytes": img_bytes}
            }
        })
    except Exception as e:
        print("Vision attachment error:", e)
        return {}

    messages = [prompt]
    model_id = "us.meta.llama3-2-11b-instruct-v1:0"

    try:
        response = get_llm().client.invoke_model(
            modelId=model_id,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1024,
                "temperature": 0.5,
                "messages": messages
            })
        )
        body = json.loads(response.get("body").read().decode("utf-8"))
        ans = body.get("content", [{"text": ""}])[0]["text"]
        return PlainTextResponse(ans)
    except Exception as e:
        import traceback
        traceback.print_exc()
        try:
            # Fallback to Mistral logic or similar if lamma fails on vision format
            pass
        except:
            pass
        return PlainTextResponse("{}")
