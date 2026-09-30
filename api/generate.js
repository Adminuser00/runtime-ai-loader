export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Prompt required hai." });

  // Correct Variable Names Matching .env
  const KEYS = [
    process.env.GROQ_API_KEY1,
    process.env.GROQ_API_KEY2,
    process.env.GROQ_API_KEY3,
    process.env.GROQ_KEY_1,
    process.env.GROQ_KEY_2,
    process.env.GROQ_KEY_3,
    process.env.GROQ_API_KEY
  ].filter(Boolean);

  if (KEYS.length === 0) {
    return res.status(500).json({
      error: "No Groq API Keys found. Vercel Environment Variables check karein!"
    });
  }

  // Model Fallbacks (Fastest to Large)
  const MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768"
  ];

  for (let key of KEYS) {
    for (let model of MODELS) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: "You are JARVIS DevDeck Pro. An elite AI full-stack dev assistant." },
              { role: "user", content: prompt }
            ],
            temperature: 0.7
          })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
          return res.status(200).json({
            result: data.choices[0].message.content,
            modelUsed: model
          });
        }
      } catch (err) {
        console.error(`Failed with model ${model}:`, err.message);
        continue;
      }
    }
  }

  return res.status(500).json({
    error: "Sabhi Groq Keys rate-limit ya invalid ho chuki hain. Console.groq.com se new key generate karke Vercel mein add karein."
  });
}
