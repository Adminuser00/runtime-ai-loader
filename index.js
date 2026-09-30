import express from "express";import cors from "cors";import dotenv from "dotenv";import { inject } from '@vercel/analytics';

dotenv.config();

// Initialize Vercel Web Analytics
inject();
const app = express();app.use(cors());app.use(express.json());
// Yeh hai tumhara RUNTIME MODEL LOADER - koi file download nahi hogi
app.post("/api/generate", async (req, res) => {  const { prompt } = req.body;
  try {    // OPTION 1: Groq - Sabse fast aur 100% FREE (Recommended)    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {      method: "POST",      headers: {        "Content-Type": "application/json",        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`      },      body: JSON.stringify({        model: "llama-3.3-70b-versatile", // Free, super fast coding model        messages: [{ role: "user", content: prompt }],        temperature: 0.7      })    });
    const data = await groqRes.json();    if(data.choices) {      return res.json({ result: data.choices[0].message.content, source: "groq-runtime" });    }
    // Fallback: HuggingFace Free Inference    throw new Error("Groq failed, trying HF");
  } catch (e) {    console.log("Fallback to HF...");    const hfRes = await fetch("https://api-inference.huggingface.co/models/Qwen/Qwen2.5-Coder-32B-Instruct", {      method: "POST",      headers: { "Authorization": `Bearer ${process.env.HF_TOKEN}`, "Content-Type": "application/json" },      body: JSON.stringify({ inputs: prompt })    });    const hfData = await hfRes.json();    res.json({ result: hfData[0]?.generated_text || hfData.generated_text, source: "hf-runtime" });  }});
app.get("/", (req, res) => {  res.send("Runtime AI Loader is LIVE - No local storage used! Use POST /api/generate");});
const PORT = process.env.PORT || 3000;app.listen(PORT, () => console.log(`Server running on ${PORT}`));
