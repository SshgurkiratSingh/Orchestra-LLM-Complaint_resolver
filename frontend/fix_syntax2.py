import re

with open("/home/gurkirat/Projects/DELHI_28/frontend/app/api/admin/analytics/root-cause/route.ts", "r") as f:
    text = f.read()

# Replace the stray characters left from the original replacement
text = re.sub(r'  \}\n    \);\n  \}', '  }', text)

with open("/home/gurkirat/Projects/DELHI_28/frontend/app/api/admin/analytics/root-cause/route.ts", "w") as f:
    f.write(text)
