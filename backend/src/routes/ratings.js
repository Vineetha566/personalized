const express = require('express');
const { rateEpisode, getEpisodeRatings } = require('../db/mockDb');

const router = express.Router();
const DEMO_USER_ID = 'demo';

router.get('/:episodeId', (req, res) => {
  const ratings = getEpisodeRatings(req.params.episodeId);
  res.json({ episodeId: req.params.episodeId, ratings });
});

router.post('/:episodeId', (req, res) => {
  const { score } = req.body; // 1-5
  const numeric = Number(score);
  if (!Number.isFinite(numeric) || numeric < 1 || numeric > 5) {
    return res.status(400).json({ error: 'score must be between 1 and 5' });
  }
  const rating = rateEpisode(DEMO_USER_ID, req.params.episodeId, numeric);
  res.status(201).json({ rating });
});

module.exports = router;


