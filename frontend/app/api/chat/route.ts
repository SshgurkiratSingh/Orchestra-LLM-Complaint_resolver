export async function POST(req: Request) {
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
      return new Response(JSON.stringify({ error: err }), { status: pythonBackendRes.status });
    }

    // Forward the streaming response directly back to the client
    return new Response(pythonBackendRes.body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err: any) {
    console.error("AI Chat Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
