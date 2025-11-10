const express = require('express');
const { searchCatalog, getPodcastById } = require('../db/mockDb');

const router = express.Router();

router.get('/', (req, res) => {
  const q = (req.query.q || '').toString();
  const source = (req.query.source || '').toString();
  let results = searchCatalog(q);
  if (source === 'spotify') {
    results = results.filter(r => {
      if (r.type === 'podcast') return !!r.item.spotifyShowId;
      if (r.type === 'episode') {
        const p = getPodcastById(r.item.podcastId);
        return !!(p && p.spotifyShowId);
      }
      return false;
    });
  }
  res.json({ query: q, results });
});

module.exports = router;


