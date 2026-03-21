with open("/home/gurkirat/Projects/DELHI_28/frontend/app/api/admin/analytics/root-cause/route.ts", "r") as f:
    text = f.read()

# remove google genai import
text = text.replace('import { GoogleGenAI } from "@google/genai";\n', '')
text = text.replace('import { GoogleGenAI } from "@google/genai";', '')

# replace logic after prompt creation with fetch
old_logic_start = "    // 4. Generate Analysis using Gemini 2.5 Flash / Pro"
new_logic = """    // 4. Generate Analysis by calling Python Backend
    const response = await fetch("http://localhost:8000/analytics/root-cause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sector_name: sector.name,
        sector_code: sector.code,
        complaints_dump: complaintDump
      })
    });

    if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
    }

    const resultJson = await response.json();
    return NextResponse.json({ success: true, data: resultJson });

  } catch (error: any) {
    console.error("Root Cause Analysis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}"""

# Need to find the end of the file to replace properly
import re
text = re.sub(r'    // 4\. Generate Analysis.*', new_logic, text, flags=re.DOTALL)

with open("/home/gurkirat/Projects/DELHI_28/frontend/app/api/admin/analytics/root-cause/route.ts", "w") as f:
    f.write(text)
