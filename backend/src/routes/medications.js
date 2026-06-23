const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getMedications, createMedication, updateMedication, deleteMedication } = require('../controllers/medicationController');

const router = express.Router();
router.use(authenticate);

router.get('/', getMedications);
router.post('/', createMedication);
router.patch('/:id', updateMedication);
router.delete('/:id', deleteMedication);

module.exports = router;
