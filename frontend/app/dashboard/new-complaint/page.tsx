"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
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
  MapPin,
  Camera,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { Calendar, Building2, Mic, MicOff, Pencil, Trash2 } from "lucide-react";
import { Copy, Loader2 } from "lucide-react"; // for later
import { PageLoader } from "@/components/PageLoader";

// Dynamically import MapSelector with no SSR to avoid window not defined errors
const MapSelector = dynamic(() => import("@/components/MapSelector"), {
  ssr: false,
});

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: any[];
  action?: string;
};

export default function NewComplaintPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [accumulatedFiles, setAccumulatedFiles] = useState<File[]>([]);

  const [extractedTitle, setExtractedTitle] = useState("");
  const [extractedDesc, setExtractedDesc] = useState("");
  const [extractedType, setExtractedType] = useState("");
  const [extractedLocation, setExtractedLocation] = useState("");
  const [extractedDate, setExtractedDate] = useState("");
  const [extractedDepartment, setExtractedDepartment] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { language, setLanguage } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  useEffect(() => {
    const savedDraft = localStorage.getItem("complaintDraft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.extractedTitle) setExtractedTitle(parsed.extractedTitle);
        if (parsed.extractedDesc) setExtractedDesc(parsed.extractedDesc);
        if (parsed.extractedType) setExtractedType(parsed.extractedType);
        if (parsed.extractedLocation)
          setExtractedLocation(parsed.extractedLocation);
        if (parsed.extractedDate) setExtractedDate(parsed.extractedDate);
        if (parsed.extractedDepartment)
          setExtractedDepartment(parsed.extractedDepartment);
        if (parsed.messages) setMessages(parsed.messages);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, []);

  useEffect(() => {
    const draft = {
      extractedTitle,
      extractedDesc,
      extractedType,
      extractedLocation,
      extractedDate,
      extractedDepartment,
      messages,
    };
    localStorage.setItem("complaintDraft", JSON.stringify(draft));
  }, [
    extractedTitle,
    extractedDesc,
    extractedType,
    extractedLocation,
    extractedDate,
    extractedDepartment,
    messages,
  ]);

  const toggleRecording = (target: "input" | "desc") => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang =
      language === "English"
        ? "en-IN"
        : language === "Hindi"
          ? "hi-IN"
          : "pa-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (target === "input") {
        setInput((prev) => prev + (prev ? " " : "") + transcript);
      } else {
        setExtractedDesc((prev) => prev + (prev ? " " : "") + transcript);
      }
    };

    recognition.start();
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    setFiles(selectedFiles);

    if (!selectedFiles || selectedFiles.length === 0) return;
    setAccumulatedFiles((prev) => [...prev, ...Array.from(selectedFiles)]);

    // Trigger Image Auto-Analysis for the first image
    const file = selectedFiles[0];
    if (!file.type.startsWith("image/")) return;

    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let { width, height } = img;
            const maxDim = 800; // Resizing for quick vision analysis
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = (height / width) * maxDim;
                width = maxDim;
              } else {
                width = (width / height) * maxDim;
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          };
          img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (res.ok) {
        let aiText = await res.text();
        const match = aiText.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.title) setExtractedTitle((t) => t || parsed.title);
          if (parsed.description)
            setExtractedDesc((d) => d || parsed.description);
          if (parsed.type) setExtractedType((ty) => ty || parsed.type);
        }
      }
    } catch (err) {
      console.error("Auto-analysis failed", err);
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && (!files || files.length === 0)) return;

    // Build the user message to render immediately
    const uiAttachments: any[] = [];
    if (files) {
      for (let i = 0; i < files.length; i++) {
        uiAttachments.push({ name: files[i].name });
      }
    }
    const currentInput = input;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: currentInput,
      attachments: uiAttachments,
    };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setIsLoading(true);
    setInput("");

    try {
      const base64Attachments: { url: string; name: string }[] = [];
      if (files) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement("canvas");
                let { width, height } = img;
                const maxDim = 1120; // Bedrock Llama/Claude safe sizing
                if (width > maxDim || height > maxDim) {
                  if (width > height) {
                    height = (height / width) * maxDim;
                    width = maxDim;
                  } else {
                    width = (width / height) * maxDim;
                    height = maxDim;
                  }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.8));
              };
              img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
          });
          base64Attachments.push({ url: dataUrl, name: file.name });
        }
      }

      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
        experimental_attachments:
          m.role === "user" && m.attachments ? base64Attachments : undefined,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, language }),
      });

      if (!res.ok) throw new Error("Failed to get response from assistant");

      const aiText = await res.text();

      let aiReplyText = aiText;
      let aiAction = "NONE";
      const match = aiText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (parsed.title || parsed.Title)
            setExtractedTitle(parsed.title || parsed.Title);
          if (parsed.description || parsed.Description)
            setExtractedDesc(parsed.description || parsed.Description);
          if (parsed.type || parsed.Type)
            setExtractedType(parsed.type || parsed.Type);
          if (parsed.location || parsed.Location)
            setExtractedLocation(parsed.location || parsed.Location);
          if (parsed.date || parsed.Date)
            setExtractedDate(parsed.date || parsed.Date);
          if (parsed.department || parsed.Department)
            setExtractedDepartment(parsed.department || parsed.Department);
          if (parsed.reply) aiReplyText = parsed.reply;
          if (parsed.suggested_action) aiAction = parsed.suggested_action;
        } catch (e) {
          const tMatch = match[0].match(/"title"\s*:\s*"([^"]+)"/i);
          const dMatch = match[0].match(/"description"\s*:\s*"([^"]+)"/i);
          const tyMatch = match[0].match(/"type"\s*:\s*"([^"]+)"/i);
          const lMatch = match[0].match(/"location"\s*:\s*"([^"]+)"/i);
          const dateMatch = match[0].match(/"date"\s*:\s*"([^"]+)"/i);
          const depMatch = match[0].match(/"department"\s*:\s*"([^"]+)"/i);
          const rMatch = match[0].match(/"reply"\s*:\s*"([^"]+)"/i);
          const aMatch = match[0].match(/"suggested_action"\s*:\s*"([^"]+)"/i);
          if (tMatch) setExtractedTitle(tMatch[1]);
          if (dMatch) setExtractedDesc(dMatch[1]);
          if (tyMatch) setExtractedType(tyMatch[1]);
          if (lMatch) setExtractedLocation(lMatch[1]);
          if (dateMatch) setExtractedDate(dateMatch[1]);
          if (depMatch) setExtractedDepartment(depMatch[1]);
          if (rMatch) aiReplyText = rMatch[1];
          if (aMatch) aiAction = aMatch[1];
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: aiReplyText,
          action: aiAction,
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, an error occurred while processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setFiles(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearCase = () => {
    if (
      confirm(
        "Are you sure you want to clear the entire draft? This cannot be undone.",
      )
    ) {
      setMessages([]);
      setExtractedTitle("");
      setExtractedDesc("");
      setExtractedType("");
      setExtractedLocation("");
      setExtractedDate("");
      setExtractedDepartment("");
      setFiles(null);
      setAccumulatedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      localStorage.removeItem("complaintDraft");
    }
  };

  const startEditing = (m: Message) => {
    setEditingMessageId(m.id);
    setEditingContent(m.content);
  };

  const saveEdit = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: editingContent } : m)),
    );
    setEditingMessageId(null);
    setEditingContent("");
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
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
          description:
            extractedDesc ||
            [...messages].pop()?.content ||
            "No description provided.",
        }),
      });

      if (!complaintRes.ok) throw new Error("Failed to create complaint");
      const complaintData = await complaintRes.json();

      if (accumulatedFiles && accumulatedFiles.length > 0) {
        const formData = new FormData();
        formData.append("complaintId", complaintData.id);
        accumulatedFiles.forEach((file) => formData.append("files", file));

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Failed to upload files");
      }

      localStorage.removeItem("complaintDraft");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsSubmitting(false);
    }
  };

  if (status === "loading")
    return <PageLoader message="Preparing complaint form..." />;
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            File a Complaint
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Choose an AI assistant or fill out the form manually.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Language:
          </label>
          <select
            className="border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-md text-xs sm:text-sm p-2 flex-1 sm:flex-none sm:max-w-[150px] min-h-[44px]"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Punjabi">Punjabi</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 dark:bg-slate-800">
              <TabsTrigger
                value="ai"
                className="data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-950/30 data-[state=active]:text-indigo-700 dark:data-[state=active]:text-indigo-400"
              >
                AI Assistant
              </TabsTrigger>
              <TabsTrigger
                value="manual"
                className="data-[state=active]:bg-teal-50 dark:data-[state=active]:bg-teal-950/30 data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-400"
              >
                Manual Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="mt-0">
              <Card className="shadow-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col h-[60vh] sm:h-[70vh] lg:h-[75vh]">
                <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/30 border-b dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 dark:bg-indigo-500 p-2 rounded-full text-white">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                        AI Intake Assistant
                      </CardTitle>
                      <CardDescription className="dark:text-slate-400">
                        Describe your issue, and we'll draft the complaint for
                        you.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 dark:bg-slate-900">
                  {messages.length === 0 && (
                    <div className="text-center text-slate-500 dark:text-slate-400 mt-10">
                      Hi! What civic issue do you want to report today?
                    </div>
                  )}

                  {messages.map((m, index) => {
                    const isUser = m.role === "user";
                    const isLastMsg = index === messages.length - 1;
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 ${isUser ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"}`}
                        >
                          {isUser ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        <div
                          className={`px-3 py-2 rounded-2xl max-w-[85%] sm:max-w-[80%] whitespace-pre-wrap text-xs sm:text-sm ${isUser ? "bg-indigo-600 dark:bg-indigo-500 text-white rounded-tr-none" : "bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm rounded-tl-none"} relative group`}
                        >
                          {editingMessageId === m.id ? (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              <textarea
                                className={`w-full rounded p-2 text-sm min-h-[60px] border outline-none ${isUser ? "bg-indigo-700 text-white border-indigo-500 placeholder:text-indigo-300" : "bg-slate-50 text-slate-900 border-slate-300"}`}
                                value={editingContent}
                                onChange={(e) =>
                                  setEditingContent(e.target.value)
                                }
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={`h-7 px-3 text-xs w-auto ${isUser ? "text-white hover:text-indigo-100 hover:bg-indigo-800" : "text-slate-600"}`}
                                  onClick={cancelEdit}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className={`h-7 px-3 text-xs w-auto ${isUser ? "bg-white text-indigo-600 hover:bg-slate-100" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                                  onClick={() => saveEdit(m.id)}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {m.content}
                              {isUser && (
                                <button
                                  type="button"
                                  onClick={() => startEditing(m)}
                                  className="absolute -left-8 sm:-left-9 top-2 p-1.5 sm:p-1 text-slate-400 opacity-100 sm:opacity-0 group-hover:opacity-100 hover:text-indigo-600 transition-opacity bg-white dark:bg-slate-700 rounded-full shadow-sm border border-slate-100 dark:border-slate-600 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                                  title="Edit Message"
                                >
                                  <Pencil className="h-4 w-4 sm:h-3 sm:w-3" />
                                </button>
                              )}

                              {/* Tool / Shortcut Displays */}
                              {!isUser &&
                                isLastMsg &&
                                m.action === "REQUEST_LOCATION" &&
                                !showMap && (
                                  <div className="mt-3">
                                    <Button
                                      type="button"
                                      onClick={() => setShowMap(true)}
                                      className="bg-white text-indigo-600 hover:bg-slate-50 border border-indigo-200 shadow-sm"
                                      size="sm"
                                    >
                                      <MapPin className="h-4 w-4 mr-2" />{" "}
                                      Provide Location via Map
                                    </Button>
                                  </div>
                                )}
                              {!isUser &&
                                isLastMsg &&
                                m.action === "REQUEST_LOCATION" &&
                                showMap && (
                                  <div className="mt-3">
                                    <MapSelector
                                      onSelect={(lat, lng) => {
                                        setInput(
                                          `My location coordinates are: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                                        );
                                        setShowMap(false);
                                        setTimeout(
                                          () =>
                                            document
                                              .getElementById("chat-input")
                                              ?.focus(),
                                          100,
                                        );
                                      }}
                                      onCancel={() => setShowMap(false)}
                                    />
                                  </div>
                                )}

                              {!isUser &&
                                isLastMsg &&
                                m.action === "REQUEST_DATE" && (
                                  <div className="mt-3">
                                    <Button
                                      type="button"
                                      onClick={() => {
                                        setInput(`The incident date is: `);
                                        document
                                          .getElementById("chat-input")
                                          ?.focus();
                                      }}
                                      className="bg-white text-indigo-600 hover:bg-slate-50 border border-indigo-200 shadow-sm"
                                      size="sm"
                                    >
                                      <Calendar className="h-4 w-4 mr-2" /> Set
                                      Date
                                    </Button>
                                  </div>
                                )}

                              {!isUser &&
                                isLastMsg &&
                                m.action === "REQUEST_IMAGE" && (
                                  <div className="mt-3">
                                    <Button
                                      type="button"
                                      onClick={() =>
                                        document
                                          .getElementById("file-upload")
                                          ?.click()
                                      }
                                      className="bg-white text-indigo-600 hover:bg-slate-50 border border-indigo-200 shadow-sm relative overflow-hidden group"
                                      size="sm"
                                    >
                                      <div className="absolute inset-0 bg-indigo-100 opacity-20 group-hover:opacity-40 animate-pulse"></div>
                                      <Camera className="h-4 w-4 mr-2" /> Upload
                                      Photo
                                    </Button>
                                  </div>
                                )}

                              {m.attachments?.map(
                                (attachment: any, i: number) => (
                                  <div
                                    key={i}
                                    className="mt-2 text-xs italic opacity-80 border-t border-opacity-20 pt-1"
                                  >
                                    Attached: {attachment.name}
                                  </div>
                                ),
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 bg-slate-100 text-slate-700">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-white border shadow-sm rounded-tl-none flex items-center gap-2">
                        <span className="flex gap-1">
                          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                        </span>
                        <span className="text-xs text-slate-400">AI is thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                <CardFooter className="border-t dark:border-slate-800 p-2 sm:p-3 bg-slate-50 dark:bg-slate-800">
                  <form
                    onSubmit={handleChatSubmit}
                    className="flex gap-2 w-full flex-col sm:flex-row"
                  >
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <div className="flex gap-2 w-full">
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 cursor-pointer dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 min-h-[44px] px-3"
                        onClick={() =>
                          document.getElementById("file-upload")?.click()
                        }
                      >
                        <UploadCloud className="h-4 w-4 sm:mr-2 pointer-events-none" />
                        <span className="hidden sm:inline">{files?.length ? `${files.length} attached` : "Proof"}</span>
                      </Button>
                      <div className="flex-1 relative">
                        <Input
                          id="chat-input"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={
                            language === "Hindi"
                              ? "समस्या का वर्णन करें..."
                              : language === "Punjabi"
                                ? "ਸਮੱਸਿਆ का ਵਰਣਨ ਕਰੋ..."
                                : "Describe the issue..."
                          }
                          className="w-full bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 pr-12 min-h-[44px] text-base"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 ${isRecording ? "text-red-500 animate-pulse" : "text-slate-400 dark:text-slate-500"}`}
                          onClick={() => toggleRecording("input")}
                        >
                          {isRecording ? (
                            <MicOff className="h-5 w-5" />
                          ) : (
                            <Mic className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                      <Button
                        type="submit"
                        disabled={
                          isLoading || (!input.trim() && !files?.length)
                        }
                        className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 min-h-[44px] min-w-[44px] px-3"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </form>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="manual" className="mt-0">
              <Card className="shadow-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 h-[60vh] sm:h-[70vh] lg:h-[75vh] flex flex-col">
                <CardHeader className="bg-teal-50/50 dark:bg-teal-950/30 border-b dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-teal-600 dark:bg-teal-500 p-2 rounded-full text-white">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                        Manual Complaint Entry
                      </CardTitle>
                      <CardDescription className="dark:text-slate-400">
                        Fill in the details yourself.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-5 dark:bg-slate-900">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Complaint Title *
                    </label>
                    <Input
                      placeholder="e.g., Pothole on Main Street"
                      value={extractedTitle}
                      onChange={(e) => setExtractedTitle(e.target.value)}
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Category
                      </label>
                      <select
                        className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                        value={extractedType}
                        onChange={(e) => setExtractedType(e.target.value)}
                      >
                        <option value="">Select Category...</option>
                        <option value="Roads">Roads & Transport</option>
                        <option value="Sanitation">Sanitation</option>
                        <option value="Water">Water Supply</option>
                        <option value="Electricity">Electricity</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Date of Incident
                      </label>
                      <Input
                        type="date"
                        value={extractedDate}
                        onChange={(e) => setExtractedDate(e.target.value)}
                        className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Location
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-indigo-600 dark:text-indigo-400"
                        onClick={() => setShowMap(!showMap)}
                      >
                        <MapPin className="h-3 w-3 mr-1" />{" "}
                        {showMap ? "Hide Map" : "Pin on Map"}
                      </Button>
                    </div>
                    <Input
                      placeholder="Address or Location details"
                      value={extractedLocation}
                      onChange={(e) => setExtractedLocation(e.target.value)}
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                    />
                    {showMap && (
                      <div className="mt-2 h-48 rounded-md overflow-hidden border dark:border-slate-700">
                        <MapSelector
                          onSelect={(lat, lng) => {
                            setExtractedLocation(
                              `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                            );
                            setShowMap(false);
                          }}
                          onCancel={() => setShowMap(false)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Description
                    </label>
                    <div className="relative">
                      <textarea
                        className="flex min-h-[120px] w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:focus-visible:ring-slate-400 focus-visible:ring-offset-2 pr-10"
                        placeholder="Provide detailed information about your complaint..."
                        value={extractedDesc}
                        onChange={(e) => setExtractedDesc(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`absolute right-2 bottom-2 h-8 w-8 ${isRecording ? "text-red-500 animate-pulse bg-red-50 dark:bg-red-950/30" : "text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800"} hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full`}
                        onClick={() => toggleRecording("desc")}
                      >
                        {isRecording ? (
                          <MicOff className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800">
                  <div className="w-full flex justify-between items-center">
                    <div className="flex items-center gap-2 relative">
                      <input
                        id="manual-file-upload"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById("manual-file-upload")?.click()
                        }
                        className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <UploadCloud className="h-4 w-4 mr-2" />
                        {accumulatedFiles.length
                          ? `${accumulatedFiles.length} proofs held`
                          : "Attach Proof"}
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Draft Panel */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 h-fit lg:sticky lg:top-6">
          <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" /> Draft Case
                </CardTitle>
                <CardDescription className="dark:text-slate-400">
                  Fields automatically populate as we chat.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCase}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 -mt-1 h-8 px-2 flex"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Generated Title
              </p>
              <Input
                className="text-sm font-medium text-slate-900 dark:text-slate-100 border bg-white dark:bg-slate-800 dark:border-slate-700"
                value={extractedTitle}
                onChange={(e) => setExtractedTitle(e.target.value)}
                placeholder="Title..."
              />
            </div>

            {extractedType && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Category
                </p>
                <Badge
                  variant="secondary"
                  className="text-xs bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900"
                >
                  {extractedType}
                </Badge>
              </div>
            )}

            {extractedLocation && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Location
                </p>
                <Input
                  className="text-sm font-medium text-slate-900 dark:text-slate-100 border bg-white dark:bg-slate-800 dark:border-slate-700"
                  value={extractedLocation}
                  onChange={(e) => setExtractedLocation(e.target.value)}
                  placeholder="Location..."
                />
              </div>
            )}

            {extractedDate && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Date
                </p>
                <Input
                  className="text-sm font-medium text-slate-900 dark:text-slate-100 border bg-white dark:bg-slate-800 dark:border-slate-700"
                  value={extractedDate}
                  onChange={(e) => setExtractedDate(e.target.value)}
                  placeholder="Date/Time..."
                />
              </div>
            )}

            {extractedDepartment && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Handling Dept
                </p>
                <Input
                  className="text-sm font-medium text-slate-900 dark:text-slate-100 border bg-white dark:bg-slate-800 dark:border-slate-700"
                  value={extractedDepartment}
                  onChange={(e) => setExtractedDepartment(e.target.value)}
                  placeholder="Department..."
                />
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Details (Summary)
              </p>
              <textarea
                className="text-sm text-slate-700 dark:text-slate-300 border dark:border-slate-700 rounded-md p-2 bg-white dark:bg-slate-800 min-h-[5rem] w-full"
                value={extractedDesc}
                onChange={(e) => setExtractedDesc(e.target.value)}
                placeholder="Description..."
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Attached Proofs
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {accumulatedFiles.length > 0 ? (
                  accumulatedFiles.map((f, i) => (
                    <Badge key={i} variant="secondary" className="text-xs dark:bg-slate-800 dark:text-slate-300">
                      {f.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500">No proofs uploaded yet.</span>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2 border-t dark:border-slate-700">
            <Button
              onClick={handleFinalSubmit}
              disabled={!extractedTitle || isSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Filing Case...</>
              ) : "File Formal Complaint"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
