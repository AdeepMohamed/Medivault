const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { getUsers, updateUserRole, getAllRecords, getAllAuditLogs, getAdminStats } = require('../controllers/adminController');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.get('/records', getAllRecords);
router.get('/audit', getAllAuditLogs);

module.exports = router;
