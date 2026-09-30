export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.end();

  const {pluginName} = req.body || {};
  const prompts = {
    cat: "Create a JS module public/plugins/cat.js with export const status='Cat Layer Active'; export function init(){ console.log('cat ready'); window.addEventListener('run-plugin', e=>{ if(e.detail.name==='cat') alert('CAT layer running - file explorer active') }) }",
    fetch: "Create JS module public/plugins/fetch.js with fetch layer - handles smart browser fetch with history, cache, form saving. export status and init",
    execution: "Create JS module public/plugins/execution.js - handles code execution sandbox, runs snippets, captures output",
    processing: "Create JS module public/plugins/processing.js - handles data processing, OSINT parsing, IP/DNS processing pipeline",
    development: "Create JS module public/plugins/development.js - handles live dev server, hot reload, file watch"
  };

  const GROQ_KEY = process.env.GROQ_KEY_1 || process.env.GROQ_API_KEY;
  if(!GROQ_KEY) return res.json({error:'GROQ key missing'});

  try{
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+GROQ_KEY},
      body: JSON.stringify({
        model:"llama-3.1-8b-instant",
        messages:[{role:"user", content: prompts[pluginName] || `Create JS module for ${pluginName} layer`}],
        temperature:0.5
      })
    });
    const d = await r.json();
    const code = d.choices[0].message.content;
    // Yahan Vercel pe file write nahi ho sakti, isiliye code return karenge aur frontend localStorage me save karega
    return res.json({result: code, plugin: pluginName, note: "Copy this code to public/plugins/"+pluginName+".js"});
  }catch(e){
    return res.json({error:e.message});
  }
}
