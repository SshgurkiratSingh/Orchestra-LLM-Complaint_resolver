const fs = require('fs');

const data = `"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertCircle,
  UploadCloud,
  Send,
  Bot,
  User,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Message = { id: string; role: 'user' | 'assistant'; content: string; attachments?: any[] };

export default function NewComplaintPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileList | null>(null);

  const [extractedTitle, setExtractedTitle] = useState("");
  const [extractedDesc, setExtractedDesc] = useState("");
  const [extractedType, setExtractedType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && (!files || files.length === 0)) return;

    // Build the user message to render immediately
    const uiAttachments: any[] = [];
    if (files) {
      for (let i = 0; i < files.length; i++) {
        uiAttachments.push({ name: files[i].name });
      }
    }
    const currentInput = input;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: currentInput, attachments: uiAttachments };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setIsLoading(true);
    setInput("");

    try {
      const base64Attachments = [];
      if (files) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          base64Attachments.push({ url: dataUrl, name: file.name });
        }
      }

      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content,
        experimental_attachments: m.role === 'user' ? base64Attachments : undefined
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages })
      });

      if (!res.ok) throw new Error("Failed to get response from assistant");
      
      const data = await res.json();
      const aiText = data.content || "";

      let isDraftSuccess = false;
      const match = aiText.match(/\\{[\\s\\S]*\\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (parsed.title || parsed.Title) setExtractedTitle(parsed.title || parsed.Title);
          if (parsed.description || parsed.Description) setExtractedDesc(parsed.description || parsed.Description);
          if (parsed.type || parsed.Type) setExtractedType(parsed.type || parsed.Type);
          isDraftSuccess = true;
        } catch (e) {
          const tMatch = match[0].match(/"title"\\s*:\\s*"([^"]+)"/i);
          const dMatch = match[0].match(/"description"\\s*:\\s*"([^"]+)"/i);
          const tyMatch = match[0].match(/"type"\\s*:\\s*"([^"]+)"/i);
          if (tMatch) { setExtractedTitle(tMatch[1]); isDraftSuccess = true; }
          if (dMatch) setExtractedDesc(dMatch[1]);
          if (tyMatch) setExtractedType(tyMatch[1]);
        }
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: isDraftSuccess ? "✨ I have drafted the case details. Please review them in the panel." : aiText
      }]);

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, an error occurred while processing your request."
      }]);
    } finally {
      setIsLoading(false);
      // We don't wipe files immediately if the user wants to submit them for the actual complaint,
      // but typically we do for a new chat turn. We'll leave them so they can hit "File Formal Complaint" with them attached!
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const complaintRes = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: extractedTitle || "Citizen Issue",
          description: extractedDesc || [...messages].pop()?.content || "No description provided."
        }),
      });

      if (!complaintRes.ok) throw new Error("Failed to create complaint");
      const complaintData = await complaintRes.json();

      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append("complaintId", complaintData.id);
        Array.from(files).forEach((file) => formData.append("files", file));
        
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("Failed to upload files");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsSubmitting(false);
    }
  };

  if (status === "loading") return <div className="p-10 text-center text-slate-500">Loading...</div>;
  if (status === "unauthenticated") { router.push("/login"); return null; }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-100">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg border-slate-200 flex flex-col h-[75vh]">
          <CardHeader className="bg-indigo-50/50 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-full text-white"><Bot className="h-5 w-5" /></div>
              <div>
                <CardTitle className="text-xl text-slate-900">AI Intake Assistant</CardTitle>
                <CardDescription>Describe your issue, and we'll draft the complaint for you.</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 mt-10">Hi! What civic issue do you want to report today?</div>
            )}
            
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={\`flex gap-3 \${isUser ? "flex-row-reverse" : ""}\`}>
                  <div className={\`p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 \${isUser ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"}\`}>
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={\`px-4 py-2 rounded-2xl max-w-[80%] whitespace-pre-wrap text-sm \${isUser ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border text-slate-800 shadow-sm rounded-tl-none"}\`}>
                    {m.content.includes("✨") ? <span className="text-teal-600 font-medium">{m.content}</span> : m.content}
                    {m.attachments?.map((attachment: any, i: number) => (
                      <div key={i} className="mt-2 text-xs italic opacity-80 border-t border-opacity-20 pt-1">
                        Attached: {attachment.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3">
                <div className="p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 bg-slate-100 text-slate-700"><Bot className="h-4 w-4" /></div>
                <div className="px-4 py-2 rounded-2xl bg-white border text-slate-500 text-sm shadow-sm rounded-tl-none">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <CardFooter className="border-t p-3 bg-slate-50">
            <form onSubmit={handleChatSubmit} className="flex gap-2 w-full flex-wrap md:flex-nowrap">
              <input id="file-upload" type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => setFiles(e.target.files)} />
              <Button type="button" variant="outline" className="shrink-0 cursor-pointer" onClick={() => document.getElementById("file-upload")?.click()}>
                <UploadCloud className="h-4 w-4 mr-2 pointer-events-none" />
                {files?.length ? \`\${files.length} attached\` : "Proof"}
              </Button>
              <div className="flex-1 flex gap-2 w-full">
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe the issue..." className="flex-1 bg-white" disabled={isLoading} />
                <Button type="submit" disabled={isLoading || (!input.trim() && !files?.length)} className="bg-indigo-600 hover:bg-indigo-700"><Send className="h-4 w-4" /></Button>
              </div>
            </form>
          </CardFooter>
        </Card>

        {/* Draft Panel */}
        <Card className="shadow-lg border-slate-200 h-fit sticky top-6">
          <CardHeader className="bg-slate-50 border-b pb-4">
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-teal-600" /> Draft Case</CardTitle>
            <CardDescription>Fields automatically populate as we chat.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Generated Title</p>
              <Input className="text-sm font-medium text-slate-900 border bg-white" value={extractedTitle} onChange={(e) => setExtractedTitle(e.target.value)} placeholder="Title..." />
            </div>

            {extractedType && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</p>
                <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">{extractedType}</Badge>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Details</p>
              <textarea className="text-sm text-slate-700 border rounded-md p-2 bg-white min-h-[5rem] w-full" value={extractedDesc} onChange={(e) => setExtractedDesc(e.target.value)} placeholder="Description..." />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Attachments</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {files && files.length > 0 ? (
                  Array.from(files).map((f, i) => <Badge key={i} variant="secondary" className="text-xs">{f.name}</Badge>)
                ) : <span className="text-xs text-slate-400">No explicit proofs.</span>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2 border-t">
            <Button onClick={handleFinalSubmit} disabled={!extractedTitle || isSubmitting} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
              {isSubmitting ? "Filing Case..." : "File Formal Complaint"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('frontend/app/dashboard/new-complaint/page.tsx', data);
console.log("Frontend rewritten.");
