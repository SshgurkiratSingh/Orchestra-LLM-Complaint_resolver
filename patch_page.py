import re

with open("/home/gurkirat/Projects/DELHI_28/frontend/app/dashboard/new-complaint/page.tsx", "r") as f:
    content = f.read()

# Add imports
content = content.replace('import { Calendar, Building2 } from "lucide-react";',
'''import { Calendar, Building2, Mic, MicOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy } from "lucide-react"; // for later''')

# Now add draft persistence
state_block = """  const [extractedTitle, setExtractedTitle] = useState("");
  const [extractedDesc, setExtractedDesc] = useState("");
  const [extractedType, setExtractedType] = useState("");
  const [extractedLocation, setExtractedLocation] = useState("");
  const [extractedDate, setExtractedDate] = useState("");
  const [extractedDepartment, setExtractedDepartment] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");"""

persistence_block = state_block + """
  const [language, setLanguage] = useState("English");
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");

  useEffect(() => {
    const savedDraft = localStorage.getItem("complaintDraft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.extractedTitle) setExtractedTitle(parsed.extractedTitle);
        if (parsed.extractedDesc) setExtractedDesc(parsed.extractedDesc);
        if (parsed.extractedType) setExtractedType(parsed.extractedType);
        if (parsed.extractedLocation) setExtractedLocation(parsed.extractedLocation);
        if (parsed.extractedDate) setExtractedDate(parsed.extractedDate);
        if (parsed.extractedDepartment) setExtractedDepartment(parsed.extractedDepartment);
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
  }, [extractedTitle, extractedDesc, extractedType, extractedLocation, extractedDate, extractedDepartment, messages]);

  const toggleRecording = (target: "input" | "desc") => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === "English" ? "en-IN" : (language === "Hindi" ? "hi-IN" : "pa-IN");
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
"""

content = content.replace(state_block, persistence_block)

# Add clear localStorage on submit
content = content.replace('      router.push("/dashboard");', '      localStorage.removeItem("complaintDraft");\n      router.push("/dashboard");')


# Layout update to use Tabs
layout_start = """      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg border-slate-200 flex flex-col h-[75vh]">"""

layout_tabs = """      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">File a Complaint</h1>
          <p className="text-sm text-slate-500">Choose an AI assistant or fill out the form manually.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Language:</label>
          <select 
            className="border-slate-300 rounded-md text-sm p-1 max-w-[150px]"
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="ai" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">AI Assistant</TabsTrigger>
              <TabsTrigger value="manual" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">Manual Entry</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai" className="mt-0">
              <Card className="shadow-lg border-slate-200 flex flex-col h-[75vh]">"""

content = content.replace(layout_start, layout_tabs)

# Modify inputs to add mic
input_block = """                <Input
                  id="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe the issue..."
                  className="flex-1 bg-white"
                  disabled={isLoading}
                />"""

input_with_mic = """                <div className="flex-1 relative">
                  <Input
                    id="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={language === "Hindi" ? "समस्या का वर्णन करें..." : language === "Punjabi" ? "ਸਮੱਸਿਆ का ਵਰਣਨ ਕਰੋ..." : "Describe the issue..."}
                    className="w-full bg-white pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}
                    onClick={() => toggleRecording("input")}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>"""

content = content.replace(input_block, input_with_mic)

# Close AI Tab Content and Add Manual Tab Content
ai_card_end = """        </Card>

        {/* Draft Panel */}"""

manual_tab = """        </Card>
            </TabsContent>

            <TabsContent value="manual" className="mt-0">
              <Card className="shadow-lg border-slate-200 h-[75vh] flex flex-col">
                <CardHeader className="bg-teal-50/50 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-teal-600 p-2 rounded-full text-white">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900">
                        Manual Complaint Entry
                      </CardTitle>
                      <CardDescription>
                        Fill in the details yourself.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Complaint Title *</label>
                    <Input 
                      placeholder="e.g., Pothole on Main Street" 
                      value={extractedTitle} 
                      onChange={e => setExtractedTitle(e.target.value)} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Category</label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                        value={extractedType}
                        onChange={e => setExtractedType(e.target.value)}
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
                      <label className="text-sm font-medium text-slate-700">Date of Incident</label>
                      <Input 
                        type="date" 
                        value={extractedDate} 
                        onChange={e => setExtractedDate(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-slate-700">Location</label>
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-indigo-600" onClick={() => setShowMap(!showMap)}>
                        <MapPin className="h-3 w-3 mr-1" /> {showMap ? "Hide Map" : "Pin on Map"}
                      </Button>
                    </div>
                    <Input 
                      placeholder="Address or Location details" 
                      value={extractedLocation} 
                      onChange={e => setExtractedLocation(e.target.value)} 
                    />
                    {showMap && (
                      <div className="mt-2 h-48 rounded-md overflow-hidden border">
                         <MapSelector
                            onSelect={(lat, lng) => {
                              setExtractedLocation(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                              setShowMap(false);
                            }}
                            onCancel={() => setShowMap(false)}
                          />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <div className="relative">
                      <textarea 
                        className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 pr-10"
                        placeholder="Provide detailed information about your complaint..."
                        value={extractedDesc}
                        onChange={e => setExtractedDesc(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`absolute right-2 bottom-2 h-8 w-8 ${isRecording ? 'text-red-500 animate-pulse bg-red-50' : 'text-slate-400 bg-slate-50'} hover:bg-slate-100 rounded-full`}
                        onClick={() => toggleRecording("desc")}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t p-4 bg-slate-50">
                   <div className="w-full flex justify-between items-center">
                     <div className="flex items-center gap-2 relative">
                        <input
                          id="manual-file-upload"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => setFiles(e.target.files)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("manual-file-upload")?.click()}
                        >
                          <UploadCloud className="h-4 w-4 mr-2" />
                          {files?.length ? `${files.length} attached` : "Attach Proof"}
                        </Button>
                     </div>
                   </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Draft Panel */}"""

content = content.replace(ai_card_end, manual_tab)

with open("/home/gurkirat/Projects/DELHI_28/frontend/app/dashboard/new-complaint/page.tsx", "w") as f:
    f.write(content)

