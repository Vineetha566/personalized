const express = require('express');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
const episodeIdToReviews = new Map(); // episodeId -> [{ userId, text, createdAt }]

router.get('/:episodeId', (req, res) => {
  const reviews = episodeIdToReviews.get(req.params.episodeId) || [];
  res.json({ episodeId: req.params.episodeId, reviews });
});

router.post('/:episodeId', authRequired, (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'text required' });
  if (!episodeIdToReviews.has(req.params.episodeId)) episodeIdToReviews.set(req.params.episodeId, []);
  const entry = { userId: req.user.id, text: text.trim(), createdAt: Date.now() };
  episodeIdToReviews.get(req.params.episodeId).push(entry);
  res.status(201).json({ review: entry });
});

module.exports = router;


