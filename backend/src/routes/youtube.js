const express = require('express');

const router = express.Router();

function extractChannelId(input) {
  if (!input) return '';
  const url = input.trim();
  const idMatch = url.match(/[a-zA-Z0-9_-]{22,}/); // simple heuristic for UC... ids
  if (idMatch) return idMatch[0];
  return url; // assume it's already an ID
}

router.get('/channel-playlists', async (req, res) => {
  const apiKey = process.env.YT_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'YT_API_KEY not set on server' });
  const channelId = extractChannelId(req.query.channelId || req.query.channelUrl || '');
  if (!channelId) return res.status(400).json({ error: 'channelId or channelUrl required' });
  try {
    const resp = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${encodeURIComponent(channelId)}&maxResults=50&key=${apiKey}`);
    const json = await resp.json();
    const playlists = (json.items || []).map(p => ({ id: p.id, title: p.snippet.title, description: p.snippet.description || '', channelTitle: p.snippet.channelTitle }));
    // Basic filter: prefer playlists likely to be podcasts
    const filtered = playlists.filter(pl => /podcast|show|talk|interview/i.test(`${pl.title} ${pl.description}`));
    res.json({ playlists: filtered.length ? filtered : playlists });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch channel playlists' });
  }
});

router.get('/playlist-items', async (req, res) => {
  const apiKey = process.env.YT_API_KEY;
  const playlistId = req.query.playlistId;
  if (!apiKey) return res.status(400).json({ error: 'YT_API_KEY not set on server' });
  if (!playlistId) return res.status(400).json({ error: 'playlistId required' });
  try {
    const resp = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(playlistId)}&maxResults=50&key=${apiKey}`);
    const json = await resp.json();
    const items = (json.items || []).map(i => ({
      videoId: i.contentDetails?.videoId,
      title: i.snippet?.title,
      description: i.snippet?.description,
      publishedAt: i.snippet?.publishedAt
    })).filter(i => i.videoId);
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch playlist items' });
  }
});

module.exports = router;


