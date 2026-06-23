import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Medications = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    name: '', dosage: '', frequency: '', start_date: '', end_date: '',
    instructions: '', prescription_record_id: '',
  });

  const load = () => {
    Promise.all([
      api.get('/medications'),
      api.get('/records?category=Prescription&limit=50'),
    ]).then(([medsRes, recRes]) => {
      setMedications(medsRes.data.medications || []);
      setRecords(recRes.data.records || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openModal = (med = null) => {
    setEditing(med);
    setForm(med ? {
      name: med.name || '', dosage: med.dosage || '', frequency: med.frequency || '',
      start_date: med.start_date || '', end_date: med.end_date || '',
      instructions: med.instructions || '', prescription_record_id: med.prescription_record_id || '',
    } : { name: '', dosage: '', frequency: '', start_date: '', end_date: '', instructions: '', prescription_record_id: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/medications/${editing.id}`, form);
        toast.success('Medication updated');
      } else {
        await api.post('/medications', form);
        toast.success('Medication added');
      }
      setShowModal(false);
      load();
    } catch { toast.error('Failed to save medication'); }
  };

  const toggleActive = async (med) => {
    try {
      await api.patch(`/medications/${med.id}`, { is_active: !med.is_active });
      toast.success(med.is_active ? 'Marked as inactive' : 'Marked as active');
      load();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this medication?')) return;
    try {
      await api.delete(`/medications/${id}`);
      toast.success('Medication removed');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const active = medications.filter(m => m.is_active);
  const inactive = medications.filter(m => !m.is_active);

  if (loading) return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>;

  return (
    <div className="page-content animate-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Medication Tracker</h1>
          <p className="page-subtitle">{active.length} active, {inactive.length} inactive</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()} id="add-med-btn">+ Add Medication</button>
      </div>

      {medications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💊</div>
          <div className="empty-title">No medications tracked</div>
          <div className="empty-desc">Add your current medications to keep track</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => openModal()}>Add Medication</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {active.length > 0 && (
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: 14 }}>💊 Active Medications</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {active.map(med => <MedCard key={med.id} med={med} onEdit={openModal} onDelete={handleDelete} onToggle={toggleActive} />)}
              </div>
            </div>
          )}
          {inactive.length > 0 && (
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>📦 Inactive / Completed</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, opacity: 0.65 }}>
                {inactive.map(med => <MedCard key={med.id} med={med} onEdit={openModal} onDelete={handleDelete} onToggle={toggleActive} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Medication' : 'Add Medication'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Medication Name *</label>
                  <input id="med-name" type="text" className="form-input" placeholder="e.g., Metformin" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Dosage</label>
                  <input id="med-dosage" type="text" className="form-input" placeholder="e.g., 500mg" value={form.dosage} onChange={e => setForm(p => ({ ...p, dosage: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Frequency</label>
                  <input id="med-frequency" type="text" className="form-input" placeholder="e.g., Twice daily" value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input id="med-start" type="date" className="form-input" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input id="med-end" type="date" className="form-input" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Instructions</label>
                <textarea id="med-instructions" className="form-textarea" rows={2} placeholder="e.g., Take with food" value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} />
              </div>
              {records.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Linked Prescription (optional)</label>
                  <select className="form-select" value={form.prescription_record_id} onChange={e => setForm(p => ({ ...p, prescription_record_id: e.target.value }))}>
                    <option value="">No linked prescription</option>
                    {records.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} id="med-submit">{editing ? 'Update' : 'Add Medication'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MedCard = ({ med, onEdit, onDelete, onToggle }) => (
  <div className="card" style={{ padding: '18px 20px' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 24 }}>💊</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{med.name}</div>
          {med.dosage && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{med.dosage}</div>}
        </div>
      </div>
      <span className={`badge ${med.is_active ? 'badge-success' : 'badge-gray'}`}>
        {med.is_active ? 'Active' : 'Inactive'}
      </span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
      {med.frequency && <span>🔄 {med.frequency}</span>}
      {med.start_date && <span>📅 Since {format(new Date(med.start_date + 'T00:00:00'), 'MMM d, yyyy')}</span>}
      {med.end_date && <span>⏱ Until {format(new Date(med.end_date + 'T00:00:00'), 'MMM d, yyyy')}</span>}
      {med.instructions && <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>"{med.instructions}"</span>}
      {med.records && <span>📄 Linked: {med.records.title}</span>}
    </div>
    <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => onEdit(med)}>Edit</button>
      <button className="btn btn-ghost btn-sm" onClick={() => onToggle(med)} title={med.is_active ? 'Mark inactive' : 'Mark active'}>
        {med.is_active ? '⏸' : '▶'}
      </button>
      <button className="btn btn-ghost btn-sm" onClick={() => onDelete(med.id)}>🗑️</button>
    </div>
  </div>
);

export default Medications;
