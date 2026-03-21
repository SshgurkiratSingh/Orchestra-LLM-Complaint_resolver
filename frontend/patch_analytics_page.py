with open("/home/gurkirat/Projects/DELHI_28/frontend/app/admin/analytics/page.tsx", "r") as f:
    text = f.read()

import_statement = 'import {\n  Select,\n  SelectContent,\n  SelectGroup,\n  SelectItem,\n  SelectLabel,\n  SelectTrigger,\n  SelectValue,\n} from "@/components/ui/select";\n\n'

text = text.replace('import { Activity, AlertTriangle, Lightbulb, MapPin, BrainCircuit } from "lucide-react";\n', 'import { Activity, AlertTriangle, Lightbulb, MapPin, BrainCircuit } from "lucide-react";\n' + import_statement)


right_col_old = """        {/* Right Col: AI Analysis Pane */}
        <div className="sticky top-8">
          <Card className="bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden min-h-[400px]">
            <CardHeader className="bg-neutral-950 border-b border-neutral-800 pb-6">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-purple-400" />
                Root Cause AI Engine
              </CardTitle>
              <CardDescription className="text-neutral-400">
                {selectedSector 
                  ? `Deep diving into 6-month historical data for ${selectedSector}...` 
                  : "Select a sector to run predictive causality analysis."}
              </CardDescription>
            </CardHeader>"""

right_col_new = """        {/* Right Col: AI Analysis Pane */}
        <div className="sticky top-8 space-y-4">
          
          <Card className="bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
            <CardHeader className="bg-neutral-950 border-b border-neutral-800 pb-6">
              <CardTitle className="text-xl text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-purple-400" />
                  Root Cause AI Engine
                </div>
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Select a sector from the drop-down below to run predictive causality analysis on 6-month historical data.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Target Analytics Sector</label>
                  <Select 
                    disabled={isAnalyzing}
                    onValueChange={(val) => {
                      const sec = sectors.find(s => s.id === val);
                      if (sec) handleRootCauseAnalysis(sec.id, sec.name);
                    }}
                  >
                    <SelectTrigger className="w-full bg-neutral-950 border-neutral-700 text-white">
                      <SelectValue placeholder="-- Interactive Map Selector --" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
                      <SelectGroup>
                        <SelectLabel className="text-neutral-400">Select Interactive Region</SelectLabel>
                        {sectors.map((sec) => (
                           <SelectItem key={sec.id} value={sec.id} className="cursor-pointer hover:bg-neutral-800 focus:bg-neutral-800 focus:text-white">
                             {sec.name} (Pop: {sec.population})
                           </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden min-h-[400px]">
            <CardHeader className="bg-neutral-950 border-b border-neutral-800 pb-4">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" />
                Analysis Results {selectedSector ? `for ${selectedSector}` : ""}
              </CardTitle>
            </CardHeader>"""

text = text.replace(right_col_old, right_col_new)

with open("/home/gurkirat/Projects/DELHI_28/frontend/app/admin/analytics/page.tsx", "w") as f:
    f.write(text)
