const supabase = require('../config/supabase');

// GET /api/medications
const getMedications = async (req, res, next) => {
  try {
    const { active } = req.query;
    let query = supabase
      .from('medications').select('*, records(title, category)')
      .eq('patient_id', req.user.id).order('created_at', { ascending: false });

    if (active === 'true') query = query.eq('is_active', true);

    const { data: medications, error } = await query;
    if (error) throw error;
    res.json({ medications });
  } catch (err) { next(err); }
};

// POST /api/medications
const createMedication = async (req, res, next) => {
  try {
    const { name, dosage, frequency, start_date, end_date, instructions, prescription_record_id } = req.body;

    const { data: medication, error } = await supabase.from('medications').insert({
      patient_id: req.user.id, name, dosage, frequency,
      start_date, end_date, instructions,
      prescription_record_id: prescription_record_id || null,
      is_active: true,
    }).select().single();

    if (error) throw error;
    res.status(201).json({ medication });
  } catch (err) { next(err); }
};

// PATCH /api/medications/:id
const updateMedication = async (req, res, next) => {
  try {
    const { name, dosage, frequency, start_date, end_date, instructions, is_active } = req.body;

    const { data: existing } = await supabase
      .from('medications').select('patient_id').eq('id', req.params.id).single();
    if (!existing || existing.patient_id !== req.user.id) {
      return res.status(404).json({ error: 'Medication not found.' });
    }

    const { data: medication, error } = await supabase
      .from('medications')
      .update({ name, dosage, frequency, start_date, end_date, instructions, is_active })
      .eq('id', req.params.id).select().single();

    if (error) throw error;
    res.json({ medication });
  } catch (err) { next(err); }
};

// DELETE /api/medications/:id
const deleteMedication = async (req, res, next) => {
  try {
    const { data: existing } = await supabase
      .from('medications').select('patient_id').eq('id', req.params.id).single();
    if (!existing || existing.patient_id !== req.user.id) {
      return res.status(404).json({ error: 'Medication not found.' });
    }

    await supabase.from('medications').delete().eq('id', req.params.id);
    res.json({ message: 'Medication removed.' });
  } catch (err) { next(err); }
};

module.exports = { getMedications, createMedication, updateMedication, deleteMedication };
