with open("/home/gurkirat/Projects/DELHI_28/frontend/app/dashboard/new-complaint/page.tsx", "r") as f:
    text = f.read()

# Implement handleFileSelect function
function_insertion = """
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    setFiles(selectedFiles);

    if (!selectedFiles || selectedFiles.length === 0) return;

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
        const match = aiText.match(/\\{[\\s\\S]*\\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.title) setExtractedTitle((t) => t || parsed.title);
          if (parsed.description) setExtractedDesc((d) => d || parsed.description);
          if (parsed.type) setExtractedType((ty) => ty || parsed.type);
        }
      }
    } catch (err) {
      console.error("Auto-analysis failed", err);
    }
  };

"""

if "const handleFileSelect =" not in text:
    text = text.replace("  const handleChatSubmit", function_insertion + "  const handleChatSubmit")

import re
text = re.sub(r'onChange=\{\(e\) => setFiles\(e\.target\.files\)\}', 'onChange={handleFileSelect}', text)

with open("/home/gurkirat/Projects/DELHI_28/frontend/app/dashboard/new-complaint/page.tsx", "w") as f:
    f.write(text)
