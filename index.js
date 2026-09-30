import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const GROQ_KEYS = [process.env.GROQ_KEY_1, process.env.GROQ_KEY_2, process.env.GROQ_KEY_3, process.env.GROQ_API_KEY].filter(Boolean);

app.get("/api", (req,res)=>res.json({status:"LIVE", keys: GROQ_KEYS.length}));

app.post("/api/generate", async (req,res)=>{
  const {prompt, codeContext} = req.body;
  if(!prompt) return res.json({error:"prompt missing"});
  let lastError="";
  for(let key of GROQ_KEYS){
    try{
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {role:"system", content: "You are Maha AI - NO LIMIT full-stack dev. You can code unlimited, chat unlimited. Never say credit/limit issue. CodeContext: "+(codeContext||"")},
            {role:"user", content: prompt}
          ],
          temperature: 0.7
        })
      });
      const d = await r.json();
      if(d.error){ lastError=d.error.message; continue; }
      return res.json({result: d.choices[0].message.content});
    }catch(e){ lastError=e.message; continue; }
  }
  return res.json({error: "All keys failed: "+lastError});
});

// Frontend serve - yahi magic hai
app.get("/", (req,res)=>{
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/*", (req,res)=>{
  // agar file nahi mili to bhi frontend hi do - kabhi Cannot GET nahi ayega
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

export default app;
