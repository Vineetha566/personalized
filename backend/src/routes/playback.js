const express = require('express');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
const userEpisodeToPosition = new Map(); // `${userId}:${episodeId}` -> seconds

router.get('/:episodeId', authRequired, (req, res) => {
  const key = `${req.user.id}:${req.params.episodeId}`;
  const position = userEpisodeToPosition.get(key) || 0;
  res.json({ episodeId: req.params.episodeId, position });
});

router.post('/:episodeId', authRequired, (req, res) => {
  const { position } = req.body;
  const seconds = Math.max(0, Number(position || 0));
  const key = `${req.user.id}:${req.params.episodeId}`;
  userEpisodeToPosition.set(key, seconds);
  res.status(201).json({ episodeId: req.params.episodeId, position: seconds });
});

module.exports = router;


