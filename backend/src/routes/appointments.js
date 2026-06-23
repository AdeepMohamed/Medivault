const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getAppointments, createAppointment, updateAppointment, deleteAppointment } = require('../controllers/appointmentController');

const router = express.Router();
router.use(authenticate);

router.get('/', getAppointments);
router.post('/', createAppointment);
router.patch('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

module.exports = router;
