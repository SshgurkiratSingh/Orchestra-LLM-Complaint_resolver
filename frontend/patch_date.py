with open("/home/gurkirat/Projects/DELHI_28/backend/main.py", "r") as f:
    text = f.read()

import_statement = "import datetime\n"

system_prompt_old = """    system_prompt = f"You are a city governance assistant for Chandigarh helping a user file a complaint. " \\
                    f"The user prefers to speak in {language}. You must reply back in {language} for conversational fields, but keep standard JSON keys in English. " \\"""

system_prompt_new = """    import datetime
    today_date = datetime.datetime.now().strftime("%Y-%m-%d")

    system_prompt = f"Today's date is {today_date}. You are a city governance assistant for Chandigarh helping a user file a complaint. " \\
                    f"The user prefers to speak in {language}. You must reply back in {language} for conversational fields, but keep standard JSON keys in English. " \\"""

text = text.replace(system_prompt_old, system_prompt_new)

with open("/home/gurkirat/Projects/DELHI_28/backend/main.py", "w") as f:
    f.write(text)
