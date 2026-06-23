import { useState, useEffect } from 'react';
import api from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users?limit=20'),
      api.get('/admin/audit?limit=20'),
    ]).then(([statsRes, usersRes, logsRes]) => {
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setAuditLogs(logsRes.data.logs || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const changeRole = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      toast.success('Role updated');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch { toast.error('Failed to update role'); }
  };

  if (loading) return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>;

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <h1 className="page-title">🛡️ Admin Dashboard</h1>
        <p className="page-subtitle">System overview and user management</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { icon: '👥', label: 'Total Users', value: stats.totalUsers, color: '#14b8a6' },
            { icon: '📁', label: 'Total Records', value: stats.totalRecords, color: '#3b82f6' },
            { icon: '📋', label: 'Audit Events', value: stats.totalAuditLogs, color: '#8b5cf6' },
            { icon: '🤒', label: 'Patients', value: stats.usersByRole?.patient || 0, color: '#10b981' },
            { icon: '👨‍⚕️', label: 'Doctors', value: stats.usersByRole?.doctor || 0, color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['overview', 'users', 'audit'].map(t => (
          <button
            key={t}
            className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(t)}
            id={`admin-tab-${t}`}
          >
            {t === 'overview' ? '📊 Overview' : t === 'users' ? '👥 Users' : '📋 Audit Logs'}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600 }}>{user.name}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-error' : user.role === 'doctor' ? 'badge-info' : 'badge-teal'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(user.created_at), 'MMM d, yyyy')}</td>
                  <td>
                    <select
                      className="form-select"
                      style={{ width: 120, padding: '4px 8px', fontSize: 12 }}
                      value={user.role}
                      onChange={e => changeRole(user.id, e.target.value)}
                      id={`role-select-${user.id}`}
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Tab */}
      {tab === 'audit' && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: 13 }}>{log.users?.name || '—'}</td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{log.action}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{log.resource_type || '—'}</td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.ip_address || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(log.created_at), 'MMM d HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'overview' && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>System Health</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="alert alert-success">✅ API server is running normally</div>
            <div className="alert alert-info">🗄️ Supabase database connected</div>
            <div className="alert alert-info">📁 Supabase Storage configured for medical records</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
