// Drop Dead Keep — Version API
// Returns the current deployed version for update checking

import { readFileSync } from 'fs';
import { resolve } from 'path';

let cachedVersion = null;

function getVersion() {
  if (cachedVersion) return cachedVersion;
  try {
    const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));
    cachedVersion = pkg.version || 'dev';
  } catch {
    cachedVersion = 'dev';
  }
  return cachedVersion;
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ version: getVersion() });
}
