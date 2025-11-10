const express = require('express');
const { buildEpisodeEmbeddings, buildUserEmbedding } = require('../ai/embeddings');
const { getTopUserTags } = require('../recommendation/engine');

const router = express.Router();
const DEMO_USER_ID = 'demo';

router.post('/build-episode-embeddings', async (req, res) => {
  const result = await buildEpisodeEmbeddings();
  res.json(result);
});

router.post('/build-user-embedding', async (req, res) => {
  const tags = getTopUserTags(DEMO_USER_ID, 5);
  const result = await buildUserEmbedding(DEMO_USER_ID, tags);
  res.json({ ...result, tags });
});

module.exports = router;


