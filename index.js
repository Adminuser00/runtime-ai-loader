import express from "express";
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req,res)=>res.send("Runtime AI Loader is LIVE - No local storage used!"));
app.post("/api/generate", async (req,res)=>{
  const {prompt}=req.body;
  try{
    const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.GROQ_API_KEY}`},
      body:JSON.stringify({model:"llama-3.3-70b-versatile",messages:[{role:"user",content:prompt}]})
    });
    const d=await r.json();
    return res.json({result:d.choices[0].message.content});
  }catch(e){return res.status(500).json({error:e.message});}
});
export default app;
