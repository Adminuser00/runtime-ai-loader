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
const KEYS = [process.env.GROQ_KEY_1, process.env.GROQ_KEY_2, process.env.GROQ_KEY_3, process.env.GROQ_API_KEY].filter(Boolean);
app.get("/api",(req,res)=>res.json({status:"LIVE", keys: KEYS.length}));
app.post("/api/generate", async (req,res)=>{
  const {prompt}=req.body;
  let err="No keys";
  for(let k of KEYS){
    try{
      const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+k},body:JSON.stringify({model:"llama-3.1-8b-instant",messages:[{role:"system",content:"You are Maha AI unlimited"},{role:"user",content:prompt}]})});
      const d=await r.json(); if(d.error){err=d.error.message; continue;}
      return res.json({result:d.choices[0].message.content});
    }catch(e){err=e.message}
  }
  res.json({error:err});
});
app.get("/*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
export default app;
