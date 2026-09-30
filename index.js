import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Runtime AI Loader is LIVE - No local storage used!");
});

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.json({ error: "prompt missing" });

    const key = process.env.GROQ_API_KEY;
    if (!key) return res.json({ error: "GROQ_API_KEY not set in Vercel" });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.json({ error: "Groq: " + data.error.message });
    }

    return res.json({ result: data.choices[0].message.content });

  } catch (err) {
    return res.json({ error: err.message });
  }
});

// Permanent fix - koi bhi ajeeb URL khule to bhi LIVE dikhe, Cannot GET kabhi na aaye
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API not found" });
  res.send("Runtime AI Loader is LIVE - No local storage used!");
});

export default app;
