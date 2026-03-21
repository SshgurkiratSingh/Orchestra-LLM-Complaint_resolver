with open("/home/gurkirat/Projects/DELHI_28/frontend/app/api/admin/analytics/root-cause/route.ts", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "if (!process.env.GEMINI_API_KEY) {" in line:
        skip = True
    
    if not skip:
        new_lines.append(line)
        
    if skip and "}" in line and "status: 500" in lines[lines.index(line) - 1] if lines.index(line) > 0 else False:
        skip = False # Found end of block
        
# A safer way to do this with regex:
import re
text = "".join(lines)
pattern = r'\s*if \(!process\.env\.GEMINI_API_KEY\) \{[\s\S]*?\}\n'
text = re.sub(pattern, '\n', text)

with open("/home/gurkirat/Projects/DELHI_28/frontend/app/api/admin/analytics/root-cause/route.ts", "w") as f:
    f.write(text)
