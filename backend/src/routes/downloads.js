const express = require('express');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
const userDownloads = new Map(); // userId -> Set(episodeId)

router.get('/', authRequired, (req, res) => {
  const set = userDownloads.get(req.user.id) || new Set();
  res.json({ episodes: Array.from(set) });
});

router.post('/:episodeId', authRequired, (req, res) => {
  if (!userDownloads.has(req.user.id)) userDownloads.set(req.user.id, new Set());
  userDownloads.get(req.user.id).add(req.params.episodeId);
  res.status(201).json({ episodeId: req.params.episodeId });
});

router.delete('/:episodeId', authRequired, (req, res) => {
  const set = userDownloads.get(req.user.id) || new Set();
  set.delete(req.params.episodeId);
  res.json({ episodeId: req.params.episodeId });
});

module.exports = router;


