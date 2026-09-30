export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();

  const {prompt} = req.body || {};
  const KEYS = [process.env.GROQ_KEY_1, process.env.GROQ_KEY_2, process.env.GROQ_KEY_3, process.env.GROQ_API_KEY].filter(Boolean);

  // MODELS - new names 2026
  const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-8b-8192", "mixtral-8x7b-32768"];

  for(let key of KEYS){
    for(let model of MODELS){
      try{
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions",{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
          body: JSON.stringify({model, messages:[{role:"system",content:"You are JARVIS DevDeck Pro. Build pro code."},{role:"user",content:prompt}]})
        });
        const d = await r.json();
        if(d.error) continue;
        return res.json({result: d.choices[0].message.content, modelUsed: model});
      }catch(e){ continue; }
    }
  }
  return res.json({error: "All Groq keys failed - Vercel > Settings > Env Variables me GROQ_KEY_1,2,3 ko All Environments pe lagao aur Redeploy dabao. Keys console.groq.com se nayi lo."});
}
