// Base44 Native Adapter (Zero External Dependencies)
export const base44 = {
  functions: {
    invoke: async (functionName, payload) => {
      const res = await fetch(`/api/${functionName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error invoking ${functionName}`);
      }
      return { data: await res.json() };
    }
  },
  connectors: {
    connectAppUser: async (connectorId) => {
      // Direct GitHub OAuth Fallback
      return `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID || 'demo'}&scope=repo`;
    }
  }
};
