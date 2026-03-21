import re

with open("/home/gurkirat/Projects/DELHI_28/frontend/app/dashboard/new-complaint/page.tsx", "r") as f:
    text = f.read()

# 1. Imports
text = text.replace('import { Calendar, Building2, Mic, MicOff } from "lucide-react";', 'import { Calendar, Building2, Mic, MicOff, Pencil, Trash2 } from "lucide-react";')

# 2. Add state inside the component
state_hook_old = """  const [activeTab, setActiveTab] = useState("ai");"""
state_hook_new = """  const [activeTab, setActiveTab] = useState("ai");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");"""
if "const [editingMessageId" not in text:
    text = text.replace(state_hook_old, state_hook_new)

# 3. Add handleClearCase and edit handlers before handleFinalSubmit
handlers = """
  const handleClearCase = () => {
    if (confirm("Are you sure you want to clear the entire draft? This cannot be undone.")) {
      setMessages([]);
      setExtractedTitle("");
      setExtractedDesc("");
      setExtractedType("");
      setExtractedLocation("");
      setExtractedDate("");
      setExtractedDepartment("");
      setFiles(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      localStorage.removeItem("complaintDraft");
    }
  };

  const startEditing = (m: Message) => {
    setEditingMessageId(m.id);
    setEditingContent(m.content);
  };

  const saveEdit = (id: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, content: editingContent } : m));
    setEditingMessageId(null);
    setEditingContent("");
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleFinalSubmit"""

if "const handleClearCase" not in text:
    text = text.replace("  const handleFinalSubmit", handlers)

# 4. Draft Case header (Clear Button)
draft_header_old = """          <CardHeader className="bg-slate-50 border-b pb-4">
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-teal-600" /> Draft Case
            </CardTitle>
            <CardDescription>
              Fields automatically populate as we chat.
            </CardDescription>
          </CardHeader>"""

draft_header_new = """          <CardHeader className="bg-slate-50 border-b pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" /> Draft Case
                </CardTitle>
                <CardDescription>
                  Fields automatically populate as we chat.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearCase} className="text-red-600 hover:text-red-700 hover:bg-red-50 -mt-1 h-8 px-2 hidden lg:flex">
                <Trash2 className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
          </CardHeader>"""

text = text.replace(draft_header_old, draft_header_new)

# Make sure Mobile clear button also works - put it in the Manual header too just in case, but let's just keep it in Draft Case. Let's fix small screen:
text = text.replace('hidden lg:flex', 'flex')

# 5. Message rendering
message_render_old = """                        <div
                          className={`px-4 py-2 rounded-2xl max-w-[80%] whitespace-pre-wrap text-sm ${isUser ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border text-slate-800 shadow-sm rounded-tl-none"}`}
                        >
                          {m.content}"""

message_render_new = """                        <div
                          className={`px-4 py-2 rounded-2xl max-w-[80%] whitespace-pre-wrap text-sm ${isUser ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border text-slate-800 shadow-sm rounded-tl-none"} relative group`}
                        >
                          {editingMessageId === m.id ? (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              <textarea
                                className={`w-full rounded p-2 text-sm min-h-[60px] border outline-none ${isUser ? 'bg-indigo-700 text-white border-indigo-500 placeholder:text-indigo-300' : 'bg-slate-50 text-slate-900 border-slate-300'}`}
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                              />
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" className={`h-7 px-3 text-xs w-auto ${isUser ? 'text-white hover:text-indigo-100 hover:bg-indigo-800' : 'text-slate-600'}`} onClick={cancelEdit}>Cancel</Button>
                                <Button size="sm" className={`h-7 px-3 text-xs w-auto ${isUser ? 'bg-white text-indigo-600 hover:bg-slate-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`} onClick={() => saveEdit(m.id)}>Save</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {m.content}
                              {isUser && (
                                <button type="button" onClick={() => startEditing(m)} className="absolute -left-8 top-2 p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-indigo-600 transition-opacity bg-white rounded-full shadow-sm border border-slate-100" title="Edit Message">
                                  <Pencil className="h-3 w-3" />
                                </button>
                              )}
"""

message_render_new_close = """                            </>
                          )}"""

# Need to accurately enclose the condition block, let's search for the end of it
text = text.replace(message_render_old, message_render_new)

# The end of the message block has attachments. 
# We need to correctly close the fragment < />
# Find:
attachment_block = """                          {m.attachments?.map((attachment: any, i: number) => (
                            <div
                              key={i}
                              className="mt-2 text-xs italic opacity-80 border-t border-opacity-20 pt-1"
                            >
                              Attached: {attachment.name}
                            </div>
                          ))}
                        </div>"""

new_attachment_block = """                          {m.attachments?.map((attachment: any, i: number) => (
                            <div
                              key={i}
                              className="mt-2 text-xs italic opacity-80 border-t border-opacity-20 pt-1"
                            >
                              Attached: {attachment.name}
                            </div>
                          ))}
                            </>
                          )}
                        </div>"""

text = text.replace(attachment_block, new_attachment_block)

with open("/home/gurkirat/Projects/DELHI_28/frontend/app/dashboard/new-complaint/page.tsx", "w") as f:
    f.write(text)
