// Drop Dead Keep — Leaderboard API
// GET: Retrieve top scores
// POST: Submit a new score

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // TODO: Fetch from Vercel KV
    return res.status(200).json({ scores: [] });
  }

  if (req.method === 'POST') {
    // TODO: Store to Vercel KV
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
