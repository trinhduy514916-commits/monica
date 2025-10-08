// Vercel Serverless Function: POST /api/chat
export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  let body = {};
  try { body = req.body || {}; } catch {}
  const { messages = [], model = "gpt-4o-mini" } = body;

  // Gọi OpenAI Chat Completions (stream)
  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: "system", content: "You are Kaito, a friendly Vietnamese study assistant." },
        ...messages,
      ],
    }),
  });

  // Trả stream SSE về client
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.flushHeaders?.();

  const reader = upstream.body.getReader();
  const encoder = new TextEncoder();

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      res.write(encoder.encode(value)); // chuyển thẳng chunk
    }
  } catch (e) {
    // client đóng kết nối sớm
  } finally {
    res.end();
  }
}
