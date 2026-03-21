with open("/home/gurkirat/Projects/DELHI_28/backend/main.py", "r") as f:
    text = f.read()

analytics_endpoint = """
class RootCauseRequest(BaseModel):
    sector_name: str
    sector_code: str
    complaints_dump: str

@app.post("/analytics/root-cause")
async def root_cause_analysis(req: RootCauseRequest):
    prompt = f\"\"\"
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
    \"\"\"
    
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
"""

if "class RootCauseRequest" not in text:
    text = text + "\n" + analytics_endpoint

with open("/home/gurkirat/Projects/DELHI_28/backend/main.py", "w") as f:
    f.write(text)
