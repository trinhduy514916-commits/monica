// api/chat.js  (serverless API - Vercel)
export default async function handler(req, res) {
  try {
    const { messages } = JSON.parse(req.body || "{}");
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages[] is required" });
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: text });
    }

    const data = await r.json();
    res.status(200).json({
      content: data?.choices?.[0]?.message?.content ?? ""
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
