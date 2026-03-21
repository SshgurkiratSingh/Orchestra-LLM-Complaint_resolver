const fs = require('fs');

const path = 'backend/main.py';
let code = fs.readFileSync(path, 'utf8');

const regex = /@app\.post\("\/chat"\)[\s\S]*return StreamingResponse\(generate\(\), media_type="text\/plain; charset=utf-8"\)/;

const newCode = `@app.post("/chat")
async def chat_endpoint(request: Request):
    from fastapi.responses import JSONResponse
    data = await request.json()
    messages = data.get("messages", [])

    system_prompt = {
        "role": "system",
        "content": "You are a helpful city governance assistant for city chandigarh helping a user file a formal complaint. "
                   "Engage the user to gather context. Crucially, if the user provides enough information "
                   "(or uploads an image/file), you must extract the details and return a proper JSON object. "
                   "The JSON should represent the different elements of the page. "
                   "Your JSON must include these exact keys: \`title\` (short string), \`description\` (detailed string), "
                   "and \`type\` (a string classification). Wrap the JSON block in \`\`\`json and \`\`\`."
    }
    # Ensure system prompt is first
    messages.insert(0, system_prompt)

    try:
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

            if isinstance(m, dict) and "experimental_attachments" in m and m["experimental_attachments"]:
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

            messages_for_invoke.append({"role": m_type if m_type in ("user", "assistant") else "user", "content": content_blocks})

        active_model_id = "anthropic.claude-3-haiku-20240307-v1:0" if has_image else llm.model_id

        if "mistral" in active_model_id.lower() and system_prompts:
            system_text = "\\n".join([sp["text"] for sp in system_prompts])
            if messages_for_invoke and messages_for_invoke[0]["role"] == "user":
                messages_for_invoke[0]["content"].insert(0, {"text": "System Role / Instructions:\\n" + system_text + "\\n\\n"})
            else:
                messages_for_invoke.insert(0, {"role": "user", "content": [{"text": "System Role / Instructions:\\n" + system_text + "\\n\\n"}]})
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
        match = re.search(r'\\{[\\s\\S]*\\}', full_text)
        if match:
            full_text = match.group(0)

        # Simply return standard JSON dict!
        return JSONResponse(content={"content": full_text})

    except Exception as e:
        error_message = f"Error during single execution: {str(e)}"
        print(error_message)
        return JSONResponse(content={"error": error_message}, status_code=500)`;

code = code.replace(regex, newCode);
fs.writeFileSync(path, code);
console.log("Backend updated.");
