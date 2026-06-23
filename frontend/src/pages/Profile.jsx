import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', date_of_birth: '', blood_group: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (user) setForm({
      name: user.name || '',
      phone: user.phone || '',
      date_of_birth: user.date_of_birth || '',
      blood_group: user.blood_group || '',
    });
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch('/auth/me', form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setPwLoading(true);
    try {
      await api.patch('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to change password'); }
    finally { setPwLoading(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MV';

  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your account and personal information</p>
      </div>

      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Avatar section */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--grad-teal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: '#fff',
            flexShrink: 0, boxShadow: 'var(--shadow-teal)',
          }}>{initials}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
            <span className="badge badge-teal" style={{ marginTop: 6 }}>{user?.role}</span>
          </div>
        </div>

        {/* Personal Info */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Personal Information</h3>
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input id="profile-name" type="text" className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email (read-only)</label>
              <input type="email" className="form-input" value={user?.email || ''} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input id="profile-phone" type="tel" className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select id="profile-blood-group" className="form-select" value={form.blood_group} onChange={e => setForm(p => ({ ...p, blood_group: e.target.value }))}>
                  <option value="">Select...</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input id="profile-dob" type="date" className="form-input" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} id="profile-save">
              {loading ? <span className="spinner spinner-sm" /> : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Change Password</h3>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input id="profile-current-pw" type="password" className="form-input" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input id="profile-new-pw" type="password" className="form-input" placeholder="Min. 8 characters" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input id="profile-confirm-pw" type="password" className="form-input" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn-secondary" disabled={pwLoading} id="profile-change-pw">
              {pwLoading ? <span className="spinner spinner-sm" /> : '🔒 Change Password'}
            </button>
          </form>
        </div>

        {/* Account Info */}
        <div className="card" style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <h3 style={{ fontWeight: 700, color: '#ef4444', marginBottom: 12 }}>Account Information</h3>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p>• Account Role: <strong style={{ color: 'var(--teal-400)' }}>{user?.role}</strong></p>
            <p>• Your records are privately stored and never shared without your consent.</p>
            <p>• To delete your account, please contact support.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
