with open("/home/gurkirat/Projects/DELHI_28/frontend/app/dashboard/new-complaint/page.tsx", "r") as f:
    text = f.read()

import re

# In frontend, the initial system prompt in page.tsx might be used for chat. Wait, we pass "messages" array from frontend to backend /chat. 
# We need to see if page.tsx sets the system prompt or if the backend does it.
