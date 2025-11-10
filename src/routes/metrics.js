const express = require('express');
const router = express.Router();
const { register } = require('../utils/metrics');

router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

module.exports = router;

