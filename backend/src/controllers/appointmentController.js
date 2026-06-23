const supabase = require('../config/supabase');
const { logAction } = require('../services/auditService');

// GET /api/appointments
const getAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('appointments').select('*').eq('patient_id', req.user.id)
      .order('appointment_date', { ascending: true });

    if (status) query = query.eq('status', status);

    const { data: appointments, error } = await query;
    if (error) throw error;
    res.json({ appointments });
  } catch (err) { next(err); }
};

// POST /api/appointments
const createAppointment = async (req, res, next) => {
  try {
    const { doctor_name, specialty, appointment_date, appointment_time, location, notes } = req.body;

    const { data: appointment, error } = await supabase.from('appointments').insert({
      patient_id: req.user.id, doctor_name, specialty,
      appointment_date, appointment_time, location, notes, status: 'Scheduled',
    }).select().single();

    if (error) throw error;

    await logAction({
      userId: req.user.id, action: 'CREATE_APPOINTMENT',
      resourceId: appointment.id, resourceType: 'appointment', ipAddress: req.ip,
    });

    res.status(201).json({ appointment });
  } catch (err) { next(err); }
};

// PATCH /api/appointments/:id
const updateAppointment = async (req, res, next) => {
  try {
    const { doctor_name, specialty, appointment_date, appointment_time, location, notes, status } = req.body;

    const { data: existing } = await supabase
      .from('appointments').select('patient_id').eq('id', req.params.id).single();
    if (!existing || existing.patient_id !== req.user.id) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({ doctor_name, specialty, appointment_date, appointment_time, location, notes, status })
      .eq('id', req.params.id).select().single();

    if (error) throw error;
    res.json({ appointment });
  } catch (err) { next(err); }
};

// DELETE /api/appointments/:id
const deleteAppointment = async (req, res, next) => {
  try {
    const { data: existing } = await supabase
      .from('appointments').select('patient_id').eq('id', req.params.id).single();
    if (!existing || existing.patient_id !== req.user.id) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    await supabase.from('appointments').delete().eq('id', req.params.id);
    res.json({ message: 'Appointment deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAppointments, createAppointment, updateAppointment, deleteAppointment };
