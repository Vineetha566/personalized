const express = require('express');
const { getAllPodcasts, getPodcastById, getEpisodesByPodcastId, getEpisodeById } = require('../db/mockDb');

const router = express.Router();

router.get('/', (req, res) => {
  const podcasts = getAllPodcasts();
  const source = (req.query.source || '').toString();
  const filtered = source === 'spotify' ? podcasts.filter(p => !!p.spotifyShowId) : podcasts;
  res.json({ podcasts: filtered });
});

router.get('/:podcastId', (req, res) => {
  const podcast = getPodcastById(req.params.podcastId);
  if (!podcast) {
    return res.status(404).json({ error: 'Podcast not found' });
  }
  res.json({ podcast });
});

router.get('/:podcastId/episodes', (req, res) => {
  const episodes = getEpisodesByPodcastId(req.params.podcastId);
  res.json({ episodes });
});

// Single episode details by ID
router.get('/episode/:episodeId', (req, res) => {
  const found = getEpisodeById(req.params.episodeId);
  if (!found) return res.status(404).json({ error: 'Episode not found' });
  const { episode, podcast } = found;
  res.json({ episode: { ...episode, podcastId: podcast.id, podcastTitle: podcast.title } });
});

// Batch episode details by IDs
router.get('/episodes', (req, res) => {
  const ids = (req.query.ids || '').toString().split(',').map(s => s.trim()).filter(Boolean);
  const episodes = [];
  for (const id of ids) {
    const found = getEpisodeById(id);
    if (found) episodes.push({ ...found.episode, podcastId: found.podcast.id, podcastTitle: found.podcast.title });
  }
  res.json({ episodes });
});

module.exports = router;


