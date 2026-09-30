export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, owner, repo, branch, files } = req.body || {};
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'DevDeck-App',
    ...(GITHUB_TOKEN ? { 'Authorization': `Bearer ${GITHUB_TOKEN}` } : {})
  };

  try {
    if (action === 'repos') {
      // Public / User Repositories Fetch
      const resGithub = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', { headers });
      if (!resGithub.ok) {
        // Fallback for public demo
        return res.status(200).json({ repos: [{ name: "Demo-Repo", full_name: "dev/Demo-Repo", default_branch: "main", private: false }] });
      }
      const repos = await resGithub.json();
      return res.status(200).json({ repos });
    }

    if (action === 'tree') {
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      const treeData = await treeRes.json();
      const codeFiles = (treeData.tree || [])
        .filter(item => item.type === 'blob' && /\.(js|jsx|ts|tsx|py|sh|json|html|css|go|rs|yml)$/i.test(item.path))
        .map(item => ({ path: item.path, size: item.size, language: item.path.split('.').pop() }));

      return res.status(200).json({ files: codeFiles });
    }

    if (action === 'import') {
      return res.status(200).json({ imported: files.length });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
