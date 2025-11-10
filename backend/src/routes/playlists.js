const express = require('express');
const { getUserPlaylists, createPlaylist, addEpisodeToPlaylist, removeEpisodeFromPlaylist, deletePlaylist } = require('../db/mockDb');

const router = express.Router();

// For demo, assume single userId "demo"
const DEMO_USER_ID = 'demo';

router.get('/', (req, res) => {
  const playlists = getUserPlaylists(DEMO_USER_ID);
  res.json({ playlists });
});

router.post('/', (req, res) => {
  const name = req.body.name;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const playlist = createPlaylist(DEMO_USER_ID, name);
  res.status(201).json({ playlist });
});

router.post('/:playlistId/episodes', (req, res) => {
  const { episodeId } = req.body;
  if (!episodeId) return res.status(400).json({ error: 'episodeId is required' });
  const playlist = addEpisodeToPlaylist(DEMO_USER_ID, req.params.playlistId, episodeId);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
  res.json({ playlist });
});


router.delete('/:playlistId/episodes/:episodeId', (req, res) => {
  const playlist = removeEpisodeFromPlaylist(DEMO_USER_ID, req.params.playlistId, req.params.episodeId);
  if (!playlist) return res.status(404).json({ error: 'Playlist or episode not found' });
  res.json({ playlist });
});

// Delete a playlist
router.delete('/:playlistId', (req, res) => {
  const ok = deletePlaylist(DEMO_USER_ID, req.params.playlistId);
  if (!ok) return res.status(404).json({ error: 'Playlist not found' });
  const playlists = getUserPlaylists(DEMO_USER_ID);
  res.json({ success: true, playlists });
});

module.exports = router;


