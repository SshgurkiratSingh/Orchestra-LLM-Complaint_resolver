const fs = require('fs');
const newCode = `export async function POST(req: Request) {
  try {
    const body = await req.json();

    const pythonBackendRes = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!pythonBackendRes.ok) {
      const err = await pythonBackendRes.text();
      return new Response(JSON.stringify({ error: err }), { status: pythonBackendRes.status, headers: { "Content-Type": "application/json" } });
    }

    const data = await pythonBackendRes.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("AI Chat Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
`;
fs.writeFileSync('frontend/app/api/chat/route.ts', newCode);
console.log("Proxy updated.");
