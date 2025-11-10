const { catalog } = require('../db/mockDb');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';

// In-memory stores
const episodeIdToEmbedding = new Map();
const userIdToEmbedding = new Map();

async function getEmbedding(text) {
  if (!OPENAI_API_KEY) return null;
  const body = { input: text, model: MODEL };
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify(body)
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data?.[0]?.embedding || null;
}

async function buildEpisodeEmbeddings() {
  if (!OPENAI_API_KEY) return { built: 0 };
  let built = 0;
  for (const p of catalog.podcasts) {
    for (const e of p.episodes) {
      if (episodeIdToEmbedding.has(e.id)) continue;
      const text = `${e.title}\n${e.description || ''}\nTags: ${(e.tags || []).join(', ')}`;
      const emb = await getEmbedding(text);
      if (emb) { episodeIdToEmbedding.set(e.id, emb); built++; }
    }
  }
  return { built };
}

async function buildUserEmbedding(userId, topTags = []) {
  if (!OPENAI_API_KEY) return { ok: false };
  const text = `User interests: ${topTags.join(', ')}`;
  const emb = await getEmbedding(text);
  if (emb) { userIdToEmbedding.set(userId, emb); return { ok: true }; }
  return { ok: false };
}

function cosine(a, b) {
  if (!a || !b) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function scoreWithEmbeddings(userId, episodeId) {
  const ue = userIdToEmbedding.get(userId);
  const ee = episodeIdToEmbedding.get(episodeId);
  if (!ue || !ee) return null;
  return cosine(ue, ee);
}

module.exports = {
  buildEpisodeEmbeddings,
  buildUserEmbedding,
  scoreWithEmbeddings,
  episodeIdToEmbedding,
  userIdToEmbedding
};


