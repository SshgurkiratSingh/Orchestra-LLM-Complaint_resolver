import base64
from langgraph.graph import StateGraph, START, END
import google.generativeai as genai
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

# Configure Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "AIzaSyBtfybE6blmH9fpUrWhr4FrXeU-ok0fiTo"))

class GeminiLLM:
    def __init__(self, model_name="gemini-2.5-flash"):
        self.model = genai.GenerativeModel(model_name)

    def invoke(self, prompt: str):
        response = self.model.generate_content(prompt)
        class Response:
            content = response.text
        return Response()

def get_llm():
    return GeminiLLM()

llm = get_llm()

from orchestrator import run_orchestration_workflow

class ComplaintRequest(BaseModel):
    id: str = ""
    title: str
    description: str

@app.post("/orchestrate")
async def run_orchestration(req: ComplaintRequest):
    result = await run_orchestration_workflow(req.id, req.title, req.description)
    return result


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

    import datetime
    today_date = datetime.datetime.now().strftime("%Y-%m-%d")

    system_prompt = f"Today's date is {today_date}. You are a city governance assistant for Chandigarh helping a user file a complaint. " \
                    f"The user prefers to speak in {language}. You must reply back in {language} for conversational fields, but keep standard JSON keys in English. " \
                    "You MUST ALWAYS respond with a raw JSON object containing exactly these keys: " \
                    "`title` (short string), " \
                    "`description` (detailed string summarizing the facts), " \
                    "`type` (a string classification), " \
                    "`location` (extracted address or coordinates, or empty string), " \
                    "`date` (extracted incident date or time, or empty string), " \
                    "`department` (e.g. Police, PWD, Health, Transport, or empty string), " \
                    "`reply` (your conversational response to the user asking for missing info or confirming details), " \
                    "and `suggested_action` (use 'REQUEST_LOCATION' if you need an address, 'REQUEST_IMAGE' if you want a photo, 'REQUEST_DATE' if you need an incident date, else 'NONE'). " \
                    "Ensure the JSON is valid and do not write anything else outside the JSON."

    async def generate():
        try:
            model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_prompt)
            
            gemini_messages = []
            for m in messages:
                m_type = m.get('role', 'user')
                content = m.get('content', '')
                if m_type == "system":
                    continue
                
                parts = [content]
                
                if isinstance(m, dict) and "experimental_attachments" in m:
                    for att in m["experimental_attachments"]:
                        url = att.get("url", "")
                        if url.startswith("data:image"):
                            try:
                                header, b64_data = url.split(',', 1)
                                mime_type = header.split(':')[1].split(';')[0]
                                img_bytes = base64.b64decode(b64_data)
                                parts.append({
                                    "mime_type": mime_type,
                                    "data": img_bytes
                                })
                            except Exception as e:
                                print("Error parsing attachment:", e)
                                
                role = "user" if m_type in ("human", "user") else "model"
                gemini_messages.append({"role": role, "parts": parts})
                
            response = model.generate_content(gemini_messages)
            full_text = response.text
            
            import re
            match = re.search(r'\{[\s\S]*\}', full_text)
            if match:
                full_text = match.group(0)
            
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
        return PlainTextResponse("{}")

    prompt_text = "Analyze this civic issue image. Respond ONLY with a raw JSON object containing these keys: `title` (short title of the issue), `type` (suggested category based on image, e.g. Roads, Sanitation, etc), and `description` (short summary of what is seen)."
    
    try:
        header, b64_data = image.split(',', 1)
        mime_type = header.split(':')[1].split(';')[0]
        img_bytes = base64.b64decode(b64_data)
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content([
            prompt_text,
            {"mime_type": mime_type, "data": img_bytes}
        ])
        
        ans = response.text
        import re
        match = re.search(r'\{[\s\S]*\}', ans)
        if match:
            ans = match.group(0)
            
        return PlainTextResponse(ans)
    except Exception as e:
        print("Vision attachment error:", e)
        return PlainTextResponse("{}")



class RootCauseRequest(BaseModel):
    sector_name: str
    sector_code: str
    complaints_dump: str

@app.post("/analytics/root-cause")
async def root_cause_analysis(req: RootCauseRequest):
    prompt = f"""
      You are an expert urban planner and root cause analyst for the Chandigarh Municipal Corporation.
      Analyze the following 6-month grievance data for {req.sector_name} (Code: {req.sector_code}).
      
      Grievance Data:
      {req.complaints_dump}
      
      Identify the underlying systemic root causes (e.g., aging infrastructure, poor vendor performance, seasonal weather events). 
      Provide a highly precise analysis.
      
      Output strictly in JSON format matching this structure:
      {{
        "summary": "A 2-3 sentence overarching conclusion.",
        "keyIssues": ["Specific issue string 1", "Specific issue string 2"],
        "recommendation": "One actionable recommendation for the Chief Engineer or DC."
      }}
    """
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Return the parsed JSON directly
        import json
        return json.loads(response.text)
    except Exception as e:
        print("Root cause analysis error:", e)
        return {
            "summary": "Analysis generated but failed to parse or execute.",
            "keyIssues": ["Error generating insights"],
            "recommendation": "Please try running the analysis again."
        }
