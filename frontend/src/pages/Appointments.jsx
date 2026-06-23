import { useState, useEffect } from 'react';
import api from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLORS = { Scheduled: 'badge-info', Completed: 'badge-success', Cancelled: 'badge-error' };

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ doctor_name: '', specialty: '', appointment_date: '', appointment_time: '', location: '', notes: '', status: 'Scheduled' });

  const load = () => {
    api.get('/appointments').then(r => setAppointments(r.data.appointments || [])).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openModal = (appt = null) => {
    setEditing(appt);
    setForm(appt ? {
      doctor_name: appt.doctor_name || '',
      specialty: appt.specialty || '',
      appointment_date: appt.appointment_date || '',
      appointment_time: appt.appointment_time || '',
      location: appt.location || '',
      notes: appt.notes || '',
      status: appt.status || 'Scheduled',
    } : { doctor_name: '', specialty: '', appointment_date: '', appointment_time: '', location: '', notes: '', status: 'Scheduled' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/appointments/${editing.id}`, form);
        toast.success('Appointment updated');
      } else {
        await api.post('/appointments', form);
        toast.success('Appointment scheduled');
      }
      setShowModal(false);
      load();
    } catch { toast.error('Failed to save appointment'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Appointment removed');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const upcoming = appointments.filter(a => a.status === 'Scheduled');
  const past = appointments.filter(a => a.status !== 'Scheduled');

  if (loading) return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>;

  return (
    <div className="page-content animate-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">{upcoming.length} upcoming, {past.length} past</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()} id="add-appointment-btn">
          + Schedule Appointment
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <div className="empty-title">No appointments yet</div>
          <div className="empty-desc">Schedule your first doctor appointment</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => openModal()}>Schedule Now</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📅</span> Upcoming
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {upcoming.map(appt => <AppointmentCard key={appt.id} appt={appt} onEdit={openModal} onDelete={handleDelete} />)}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📋</span> Past Appointments
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, opacity: 0.7 }}>
                {past.map(appt => <AppointmentCard key={appt.id} appt={appt} onEdit={openModal} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Appointment' : 'Schedule Appointment'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Doctor Name *</label>
                  <input id="appt-doctor" type="text" className="form-input" placeholder="Dr. Smith" value={form.doctor_name} onChange={e => setForm(p => ({ ...p, doctor_name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Specialty</label>
                  <input id="appt-specialty" type="text" className="form-input" placeholder="Cardiology" value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input id="appt-date" type="date" className="form-input" value={form.appointment_date} onChange={e => setForm(p => ({ ...p, appointment_date: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input id="appt-time" type="time" className="form-input" value={form.appointment_time} onChange={e => setForm(p => ({ ...p, appointment_time: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input id="appt-location" type="text" className="form-input" placeholder="Hospital / Clinic name" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
              </div>
              {editing && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea id="appt-notes" className="form-textarea" rows={2} placeholder="Any notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} id="appt-submit">
                  {editing ? 'Update' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AppointmentCard = ({ appt, onEdit, onDelete }) => (
  <div className="card" style={{ padding: '18px 20px' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Dr. {appt.doctor_name}</div>
        {appt.specialty && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{appt.specialty}</div>}
      </div>
      <span className={`badge ${STATUS_COLORS[appt.status]}`}>{appt.status}</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
      {appt.appointment_date && (
        <span>📅 {format(new Date(appt.appointment_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}</span>
      )}
      {appt.appointment_time && <span>🕐 {appt.appointment_time}</span>}
      {appt.location && <span>📍 {appt.location}</span>}
      {appt.notes && <span style={{ marginTop: 4, fontStyle: 'italic', color: 'var(--text-muted)' }}>"{appt.notes}"</span>}
    </div>
    <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => onEdit(appt)}>Edit</button>
      <button className="btn btn-ghost btn-sm" onClick={() => onDelete(appt.id)}>🗑️</button>
    </div>
  </div>
);

export default Appointments;
