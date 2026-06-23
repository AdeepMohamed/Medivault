const express = require('express');
const { authenticate } = require('../middleware/auth');
const { summarize, getSummary, chat } = require('../controllers/aiController');

const router = express.Router();
router.use(authenticate);

router.post('/summarize/:recordId', summarize);
router.get('/summary/:recordId', getSummary);
router.post('/chat', chat);

module.exports = router;
