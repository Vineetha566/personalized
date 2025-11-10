const express = require('express');
const { upsertPodcast, upsertEpisodes, setPodcastSpotifyId, catalog } = require('../db/mockDb');

const router = express.Router();

// Heuristic: keep likely podcast episodes only
function isLikelyPodcastEpisode(snippet, durationSeconds) {
  const text = `${snippet.title} ${snippet.description || ''}`.toLowerCase();
  const hasKeyword = /(podcast|episode|ep\.|talk|show|interview)/.test(text);
  const longEnough = durationSeconds >= 20 * 60; // >= 20 minutes
  return hasKeyword || longEnough;
}

function parseISODurationToSeconds(iso) {
  // Simple ISO8601 duration parser PT#H#M#S
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '');
  if (!m) return 0;
  const h = Number(m[1] || 0), mm = Number(m[2] || 0), s = Number(m[3] || 0);
  return h*3600 + mm*60 + s;
}

function extractPlaylistId(input) {
  if (!input) return '';
  const s = String(input).trim();
  // If full URL with list param
  const m = s.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // If it's a share URL like https://youtube.com/playlist?list=... or just ID
  return s;
}

router.post('/youtube', async (req, res) => {
  const body = req.body || {};
  const playlistId = extractPlaylistId(body.playlistId || body.playlistUrl);
  const apiKey = process.env.YT_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'YT_API_KEY not set on server' });
  if (!playlistId) return res.status(400).json({ error: 'playlistId is required' });

  try {
    // 1) Playlist metadata
    const playlistResp = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${encodeURIComponent(playlistId)}&key=${apiKey}`);
    const playlistJson = await playlistResp.json();
    const pl = (playlistJson.items || [])[0];
    if (!pl) return res.status(404).json({ error: 'Playlist not found' });
    const podcastId = `yt-${playlistId}`;
    upsertPodcast({ id: podcastId, title: pl.snippet.title, description: pl.snippet.description || '', tags: ['youtube','podcast', pl.snippet.channelTitle] });

    // 2) Fetch up to 50 items
    const itemsResp = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${encodeURIComponent(playlistId)}&maxResults=50&key=${apiKey}`);
    const itemsJson = await itemsResp.json();
    const videoIds = (itemsJson.items || []).map(i => i.contentDetails && i.contentDetails.videoId).filter(Boolean);
    if (videoIds.length === 0) return res.json({ podcastId, imported: 0 });

    // 3) Get video details for durations
    const videosResp = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds.join(',')}&key=${apiKey}`);
    const videosJson = await videosResp.json();
    const episodes = [];
    for (const v of (videosJson.items || [])) {
      const seconds = parseISODurationToSeconds(v.contentDetails?.duration);
      if (!isLikelyPodcastEpisode(v.snippet, seconds)) continue;
      episodes.push({
        id: `yt-${v.id}`,
        title: v.snippet.title,
        description: v.snippet.description || '',
        tags: ['youtube','podcast'],
        publishedAt: v.snippet.publishedAt,
        externalUrl: `https://www.youtube.com/watch?v=${v.id}`
      });
    }

    upsertEpisodes(podcastId, episodes);
    return res.json({ podcastId, imported: episodes.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to import from YouTube' });
  }
});

// ---- Spotify helpers (Client Credentials flow) ----
let _spToken = null;
let _spTokenExp = 0;

async function getSpotifyAccessToken() {
  const now = Date.now();
  if (_spToken && now < _spTokenExp - 30_000) return _spToken;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!resp.ok) throw new Error(`Spotify token error ${resp.status}`);
  const json = await resp.json();
  _spToken = json.access_token;
  _spTokenExp = now + (json.expires_in || 3600) * 1000;
  return _spToken;
}

async function spotifyFetch(path) {
  const token = await getSpotifyAccessToken();
  const resp = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Spotify API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function searchShowByTitle(title) {
  const q = encodeURIComponent(title);
  const json = await spotifyFetch(`/search?type=show&limit=5&q=${q}`);
  return json?.shows?.items || [];
}

function pickBestShowMatch(items /*, title */) {
  return items[0] || null;
}

async function resolveCatalogShowsByTitle() {
  const results = [];
  for (const p of catalog.podcasts) {
    if (p.spotifyShowId) { results.push({ id: p.id, spotifyShowId: p.spotifyShowId, status: 'exists' }); continue; }
    if (String(p.id).startsWith('yt-')) { results.push({ id: p.id, spotifyShowId: null, status: 'skipped_youtube' }); continue; }
    try {
      const items = await searchShowByTitle(p.title);
      const best = pickBestShowMatch(items, p.title);
      if (best) {
        setPodcastSpotifyId(p.id, best.id);
        results.push({ id: p.id, spotifyShowId: best.id, status: 'linked' });
      } else {
        results.push({ id: p.id, spotifyShowId: null, status: 'not_found' });
      }
    } catch (e) {
      results.push({ id: p.id, spotifyShowId: null, status: 'error', error: e.message });
    }
  }
  return results;
}

// POST /api/import/spotify-sync -> attempts to link catalog to Spotify shows by title
router.post('/spotify/sync', async (req, res) => {
  try {
    const results = await resolveCatalogShowsByTitle();
    const linked = results.filter(r => r.status === 'linked' || r.status === 'exists').length;
    res.json({ linked, total: results.length, results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Spotify sync failed', message: e.message });
  }
});

module.exports = router;


