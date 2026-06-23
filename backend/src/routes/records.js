const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');
const {
  getRecords, getTimeline, getStats, getRecord,
  createRecord, updateRecord, uploadNewVersion,
  deleteRecord, downloadRecord,
} = require('../controllers/recordController');

const router = express.Router();

router.use(authenticate);

router.get('/', getRecords);
router.get('/timeline', getTimeline);
router.get('/stats', getStats);

router.post('/', uploadLimiter, upload.single('file'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
], createRecord);

router.get('/:id', getRecord);
router.patch('/:id', updateRecord);
router.post('/:id/version', upload.single('file'), uploadNewVersion);
router.delete('/:id', deleteRecord);
router.get('/:id/download', downloadRecord);

module.exports = router;
