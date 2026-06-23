import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const CATEGORY_ICONS = {
  Prescription: '💊', Report: '📄', Scan: '🩻', Vaccination: '💉', Lab: '🧪', Other: '📎',
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [upcomingAppts, setUpcomingAppts] = useState([]);
  const [activeMeds, setActiveMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, recordsRes, apptsRes, medsRes] = await Promise.all([
          api.get('/records/stats'),
          api.get('/records?limit=5'),
          api.get('/appointments?status=Scheduled'),
          api.get('/medications?active=true'),
        ]);
        setStats(statsRes.data.stats);
        setRecentRecords(recordsRes.data.records || []);
        setUpcomingAppts(apptsRes.data.appointments?.slice(0, 3) || []);
        setActiveMeds(medsRes.data.medications?.slice(0, 4) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  const STAT_CARDS = [
    { icon: '📁', label: 'Total Records', value: stats?.total || 0, color: '#14b8a6' },
    { icon: '📤', label: 'Recent Uploads', value: stats?.recentUploads || 0, color: '#3b82f6' },
    { icon: '💊', label: 'Active Medications', value: activeMeds.length, color: '#8b5cf6' },
    { icon: '📅', label: 'Upcoming Appointments', value: upcomingAppts.length, color: '#f59e0b' },
  ];

  return (
    <div className="page-content animate-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's an overview of your health records</p>
        </div>
        <Link to="/upload" className="btn btn-primary">
          + Upload Record
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {STAT_CARDS.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      {stats?.byCategory && Object.keys(stats.byCategory).length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Records by Category</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(stats.byCategory).map(([cat, count]) => (
              <div key={cat} className={`badge badge-${cat.toLowerCase()} cat-${cat}`} style={{ padding: '6px 14px', fontSize: 13 }}>
                {CATEGORY_ICONS[cat]} {cat}: {count}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Recent Records */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Recent Records</h3>
            <Link to="/records" style={{ fontSize: 13, color: 'var(--teal-400)' }}>View all →</Link>
          </div>
          {recentRecords.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="empty-icon">📁</div>
              <div className="empty-title">No records yet</div>
              <Link to="/upload" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Upload First Record</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentRecords.map(record => (
                <Link key={record.id} to={`/records/${record.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    transition: 'all var(--transition)', cursor: 'pointer',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[record.category]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {record.record_date ? format(new Date(record.record_date), 'MMM d, yyyy') : 'No date'}
                      </div>
                    </div>
                    <span className={`badge cat-${record.category}`} style={{ flexShrink: 0 }}>{record.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Upcoming Appointments</h3>
            <Link to="/appointments" style={{ fontSize: 13, color: 'var(--teal-400)' }}>View all →</Link>
          </div>
          {upcomingAppts.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="empty-icon">📅</div>
              <div className="empty-title">No upcoming appointments</div>
              <Link to="/appointments" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Schedule One</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingAppts.map(appt => (
                <div key={appt.id} style={{
                  padding: '12px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Dr. {appt.doctor_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {appt.specialty} • {appt.appointment_date ? format(new Date(appt.appointment_date + 'T00:00:00'), 'MMM d, yyyy') : 'TBD'}
                    {appt.appointment_time && ` at ${appt.appointment_time}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Medications */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Active Medications</h3>
            <Link to="/medications" style={{ fontSize: 13, color: 'var(--teal-400)' }}>View all →</Link>
          </div>
          {activeMeds.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="empty-icon">💊</div>
              <div className="empty-title">No active medications</div>
              <Link to="/medications" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Add Medication</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeMeds.map(med => (
                <div key={med.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 20 }}>💊</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{med.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{med.dosage} • {med.frequency}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { to: '/upload', icon: '📤', label: 'Upload Medical Record', desc: 'Add a new document' },
              { to: '/ai-assistant', icon: '🤖', label: 'Ask AI Assistant', desc: 'Get health insights' },
              { to: '/timeline', icon: '🕐', label: 'View Health Timeline', desc: 'Chronological history' },
              { to: '/share', icon: '🔗', label: 'Share with Doctor', desc: 'Create secure access link' },
            ].map((action, i) => (
              <Link key={i} to={action.to} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  transition: 'all var(--transition)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                >
                  <span style={{ fontSize: 22, width: 28, textAlign: 'center' }}>{action.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{action.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{action.desc}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 18 }}>›</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

export default Dashboard;
