const { catalog, getUserHistory, getEpisodeRatings } = require('../db/mockDb');
const { scoreWithEmbeddings } = require('../ai/embeddings');

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function buildEpisodeVector(episode) {
  const tokens = new Set([
    ...(episode.tags || []).map(t => t.toLowerCase()),
    ...tokenize(episode.title),
    ...tokenize(episode.description)
  ]);
  return tokens;
}

function jaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const v of setA) if (setB.has(v)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union ? intersection / union : 0;
}

function buildUserProfile(userId) {
  const history = getUserHistory(userId);
  const profile = new Map();
  for (const h of history) {
    const found = findEpisode(h.episodeId);
    if (!found) continue;
    const tokens = buildEpisodeVector(found);
    for (const t of tokens) profile.set(t, (profile.get(t) || 0) + 1);
  }
  return profile;
}

function findEpisode(episodeId) {
  for (const p of catalog.podcasts) {
    const e = p.episodes.find(ep => ep.id === episodeId);
    if (e) return e;
  }
  return null;
}

function scoreEpisodeForUser(userId, episode) {
  const userProfile = buildUserProfile(userId);
  const episodeTokens = buildEpisodeVector(episode);
  // Convert profile to set of top terms
  const topTerms = new Set(Array.from(userProfile.entries()).sort((a,b)=>b[1]-a[1]).slice(0,30).map(([t])=>t));
  const contentScore = jaccardSimilarity(topTerms, episodeTokens);

  // Ratings prior boosts
  const ratings = getEpisodeRatings(episode.id);
  const ratingBoost = ratings.count ? (ratings.average / 5) * 0.2 : 0; // up to +0.2

  // Recency boost (favor recent episodes by publishedAt if present)
  let recencyBoost = 0;
  if (episode.publishedAt) {
    const days = (Date.now() - new Date(episode.publishedAt).getTime()) / (1000*60*60*24);
    recencyBoost = days < 30 ? 0.2 : days < 90 ? 0.1 : 0;
  }
  // Optional AI embedding similarity
  const embSim = scoreWithEmbeddings(userId, episode.id);
  const embBoost = embSim != null ? embSim * 0.8 : 0; // up to +0.8 weight

  return contentScore + ratingBoost + recencyBoost + embBoost;
}

function generateRecommendations(userId, limit = 20) {
  const scored = [];
  for (const p of catalog.podcasts) {
    for (const e of p.episodes) {
      const score = scoreEpisodeForUser(userId, e);
      scored.push({ ...e, podcastId: p.id, podcastTitle: p.title, score: Number(score.toFixed(4)) });
    }
  }
  scored.sort((a,b) => b.score - a.score);
  return scored.slice(0, limit);
}

module.exports = {
  generateRecommendations,
  generateRecommendedPlaylists,
  getTopUserTags
};

function generateRecommendedPlaylists(userId, maxPlaylists = 3, episodesPer = 8) {
  // Build tag scores from user profile and catalog popularity
  const userProfile = buildUserProfile(userId);
  const tagToScore = new Map();
  for (const [t, w] of userProfile.entries()) tagToScore.set(t, (tagToScore.get(t) || 0) + w * 2);
  for (const p of catalog.podcasts) {
    for (const e of p.episodes) {
      for (const t of e.tags || []) tagToScore.set(t, (tagToScore.get(t) || 0) + 1);
    }
  }
  const topTags = Array.from(tagToScore.entries()).sort((a,b)=>b[1]-a[1]).slice(0, maxPlaylists).map(([t])=>t);
  const playlists = [];
  for (const tag of topTags) {
    const matches = [];
    for (const p of catalog.podcasts) for (const e of p.episodes) if ((e.tags || []).includes(tag)) matches.push({ ...e, podcastId: p.id, podcastTitle: p.title });
    // Sort by rec score for user
    matches.sort((a,b)=> scoreEpisodeForUser(userId, b) - scoreEpisodeForUser(userId, a));
    playlists.push({ id: `auto-${tag}`, title: `${capitalize(tag)} Picks`, description: `Top episodes for ${tag}`, episodes: matches.slice(0, episodesPer) });
  }
  // Fallback: if no tags, build generic playlists by most recent
  if (playlists.length === 0) {
    const all = [];
    for (const p of catalog.podcasts) for (const e of p.episodes) all.push({ ...e, podcastId: p.id, podcastTitle: p.title });
    all.sort((a,b)=> (new Date(b.publishedAt||0)) - (new Date(a.publishedAt||0)));
    playlists.push({ id: 'latest', title: 'Latest Episodes', description: 'Fresh releases across topics', episodes: all.slice(0, episodesPer) });
  }
  return playlists;
}

function capitalize(s){ return (s||'').charAt(0).toUpperCase() + (s||'').slice(1); }

function getTopUserTags(userId, max = 5) {
  const profile = buildUserProfile(userId);
  return Array.from(profile.entries()).sort((a,b)=>b[1]-a[1]).slice(0, max).map(([t])=>t);
}


