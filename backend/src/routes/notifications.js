const express = require('express');
const { getNotificationDigest } = require('../db/mockDb');

const router = express.Router();
const DEMO_USER_ID = 'demo';

router.get('/digest', (req, res) => {
  const digest = getNotificationDigest(DEMO_USER_ID);
  res.json({ digest });
});

module.exports = router;


