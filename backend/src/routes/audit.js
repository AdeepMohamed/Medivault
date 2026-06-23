const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getAuditLogs } = require('../controllers/auditController');

const router = express.Router();
router.use(authenticate);
router.get('/', getAuditLogs);

module.exports = router;
