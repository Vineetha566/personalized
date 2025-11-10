const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dataPath = path.join(__dirname, '..', 'data', 'podcasts.json');
const catalog = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// In-memory storage for demo
const userIdToPlaylists = new Map(); // userId -> [{ id, name, episodeIds: [] }]
const episodeIdToRatings = new Map(); // episodeId -> [{ userId, score }]
const userIdToListeningHistory = new Map(); // userId -> [{ episodeId, playedAt }]

function getAllPodcasts() {
  return catalog.podcasts;
}

function setPodcastSpotifyId(podcastId, spotifyShowId) {
  const p = catalog.podcasts.find(p => p.id === podcastId);
  if (!p) return null;
  p.spotifyShowId = spotifyShowId;
  return p;
}

function getPodcastById(podcastId) {
  return catalog.podcasts.find(p => p.id === podcastId);
}

function getEpisodesByPodcastId(podcastId) {
  const podcast = getPodcastById(podcastId);
  return podcast ? podcast.episodes : [];
}

function getEpisodeById(episodeId) {
  for (const p of catalog.podcasts) {
    const ep = p.episodes.find(e => e.id === episodeId);
    if (ep) return { episode: ep, podcast: p };
  }
  return null;
}

function searchCatalog(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results = [];
  for (const p of catalog.podcasts) {
    if (p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q))) {
      results.push({ type: 'podcast', item: p });
    }
    for (const e of p.episodes) {
      if (e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q) || (e.tags || []).some(t => t.toLowerCase().includes(q))) {
        results.push({ type: 'episode', item: { ...e, podcastId: p.id } });
      }
    }
  }
  return results.slice(0, 50);
}

function getUserPlaylists(userId) {
  if (!userIdToPlaylists.has(userId)) userIdToPlaylists.set(userId, []);
  return userIdToPlaylists.get(userId);
}

function createPlaylist(userId, name) {
  const playlists = getUserPlaylists(userId);
  const playlist = { id: uuidv4(), name, episodeIds: [] };
  playlists.push(playlist);
  return playlist;
}

function addEpisodeToPlaylist(userId, playlistId, episodeId) {
  const playlists = getUserPlaylists(userId);
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) return null;
  if (!playlist.episodeIds.includes(episodeId)) playlist.episodeIds.push(episodeId);
  return playlist;
}

function removeEpisodeFromPlaylist(userId, playlistId, episodeId) {
  const playlists = getUserPlaylists(userId);
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) return null;
  const idx = playlist.episodeIds.indexOf(episodeId);
  if (idx === -1) return null;
  playlist.episodeIds.splice(idx, 1);
  return playlist;
}

function deletePlaylist(userId, playlistId) {
  const playlists = getUserPlaylists(userId);
  const index = playlists.findIndex(p => p.id === playlistId);
  if (index === -1) return false;
  playlists.splice(index, 1);
  return true;
}


function rateEpisode(userId, episodeId, score) {
  if (!episodeIdToRatings.has(episodeId)) episodeIdToRatings.set(episodeId, []);
  const ratings = episodeIdToRatings.get(episodeId);
  const existing = ratings.find(r => r.userId === userId);
  if (existing) existing.score = score; else ratings.push({ userId, score });
  return { userId, episodeId, score };
}

function getEpisodeRatings(episodeId) {
  const ratings = episodeIdToRatings.get(episodeId) || [];
  const avg = ratings.length ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length : 0;
  return { average: Number(avg.toFixed(2)), count: ratings.length, ratings };
}

function recordPlay(userId, episodeId) {
  if (!userIdToListeningHistory.has(userId)) userIdToListeningHistory.set(userId, []);
  userIdToListeningHistory.get(userId).push({ episodeId, playedAt: Date.now() });
}

function getUserHistory(userId) {
  return userIdToListeningHistory.get(userId) || [];
}

function getNotificationDigest(userId) {
  // Simple digest: latest episodes from podcasts matching user's last 3 tags
  const history = getUserHistory(userId).slice(-10);
  const tagCounts = new Map();
  for (const h of history) {
    const found = getEpisodeById(h.episodeId);
    if (!found) continue;
    for (const t of found.episode.tags || []) {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    }
  }
  const topTags = Array.from(tagCounts.entries()).sort((a,b) => b[1]-a[1]).slice(0,3).map(([t]) => t);
  const items = [];
  for (const p of catalog.podcasts) {
    for (const e of p.episodes.slice(-2)) {
      if ((e.tags || []).some(t => topTags.includes(t))) {
        items.push({
          type: 'new_episode',
          message: `New episode '${e.title}' from '${p.title}' may interest you`,
          episodeId: e.id,
          podcastId: p.id
        });
      }
    }
  }
  return items.slice(0, 10);
}

function upsertPodcast(podcast) {
  const existingIdx = catalog.podcasts.findIndex(p => p.id === podcast.id);
  if (existingIdx >= 0) {
    catalog.podcasts[existingIdx] = { ...catalog.podcasts[existingIdx], ...podcast };
    return catalog.podcasts[existingIdx];
  }
  catalog.podcasts.push({ ...podcast, episodes: podcast.episodes || [] });
  return podcast;
}

function upsertEpisodes(podcastId, episodes) {
  const podcast = getPodcastById(podcastId);
  if (!podcast) return null;
  if (!podcast.episodes) podcast.episodes = [];
  const idToIndex = new Map(podcast.episodes.map((e,i)=>[e.id,i]));
  const seenIds = new Set(); // Track IDs in current batch to prevent duplicates
  for (const ep of episodes) {
    if (seenIds.has(ep.id)) continue; // Skip if already in current batch
    seenIds.add(ep.id);
    if (idToIndex.has(ep.id)) {
      const i = idToIndex.get(ep.id);
      podcast.episodes[i] = { ...podcast.episodes[i], ...ep };
    } else {
      podcast.episodes.push(ep);
    }
  }
  return podcast;
}

module.exports = {
  getAllPodcasts,
  getPodcastById,
  getEpisodesByPodcastId,
  getEpisodeById,
  searchCatalog,
  getUserPlaylists,
  createPlaylist,
  addEpisodeToPlaylist,
  removeEpisodeFromPlaylist,
  deletePlaylist,
  rateEpisode,
  getEpisodeRatings,
  recordPlay,
  getUserHistory,
  getNotificationDigest,
  catalog,
  upsertPodcast,
  upsertEpisodes,
  setPodcastSpotifyId
};


