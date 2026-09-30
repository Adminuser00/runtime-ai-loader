import express from "express";import cors from "cors";const app = express();app.use(cors());app.use(express.json());
app.get("/", (req,res)=>res.send("Runtime AI Loader is LIVE - No local storage used!"));
app.post("/api/generate", async (req,res)=>{  const {prompt}=req.body;  if(!prompt) return res.json({error:"prompt bhejo"});
  const key = process.env.GROQ_API_KEY;  if(!key) return res.json({error:"GROQ_API_KEY Vercel me nahi lagi"});
  try{    const r = await fetch("https://api.groq.com/openai/v1/chat/completions",{      method:"POST",      headers:{        "Content-Type":"application/json",        "Authorization":`Bearer ${key}`      },      body: JSON.stringify({        model: "llama-3.1-8b-instant",        messages: [{role:"user", content: prompt}]      })    });    const d = await r.json();
    // Agar Groq ne error diya toh dikhao    if(d.error) return res.json({error: "Groq Error: " + d.error.message, full: d});    if(!d.choices) return res.json({error: "Groq se choices nahi aaya", full: d});
    return res.json({result: d.choices[0].message.content});  }catch(e){    return res.json({error: e.message});  }});
export default app;
