const express = require('express');
const { keepAlive } = require('../controllers/cronController');

const router = express.Router();

// Support both GET and POST for keep-alive
router.get('/keepalive', keepAlive);
router.post('/keepalive', keepAlive);

module.exports = router;
