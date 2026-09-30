export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { pluginName } = req.body || {};
  const GROQ_KEY = process.env.GROQ_API_KEY1 || process.env.GROQ_API_KEY || process.env.GROQ_KEY_1;

  if (!GROQ_KEY) return res.status(500).json({ error: 'GROQ key missing in Vercel settings.' });

  const prompts = {
    cat: "Create a JS module for file explorer layer: export const status='Cat Active'; export function init(){ console.log('cat layer loaded'); }",
    fetch: "Create a JS module for browser fetch layer with caching: export const status='Fetch Active'; export function init(){ console.log('fetch layer loaded'); }",
    execution: "Create a JS module for code execution sandbox: export const status='Execution Active'; export function init(){ console.log('execution layer loaded'); }",
    processing: "Create a JS module for OSINT data parsing: export const status='Processing Active'; export function init(){ console.log('processing layer loaded'); }",
    development: "Create a JS module for hot reload server: export const status='Dev Active'; export function init(){ console.log('development layer loaded'); }"
  };

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompts[pluginName] || `Create JS plugin module for ${pluginName}` }],
        temperature: 0.5
      })
    });

    const d = await r.json();
    const code = d.choices?.[0]?.message?.content || "// No code generated";
    return res.status(200).json({ result: code, plugin: pluginName });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
