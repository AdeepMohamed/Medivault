import { useState, useEffect } from 'react';
import api from '../services/api';
import { format } from 'date-fns';

const CATEGORY_ICONS = {
  Prescription: '💊', Report: '📄', Scan: '🩻', Vaccination: '💉', Lab: '🧪', Other: '📎',
};

const CATEGORY_COLORS = {
  Prescription: '#8b5cf6', Report: '#3b82f6', Scan: '#f59e0b',
  Vaccination: '#10b981', Lab: '#06b6d4', Other: '#6b7280',
};

const Timeline = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/records/timeline')
      .then(res => setRecords(res.data.records || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Group by year
  const grouped = records.reduce((acc, r) => {
    const year = r.record_date ? new Date(r.record_date).getFullYear() : 'Unknown';
    if (!acc[year]) acc[year] = [];
    acc[year].push(r);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => b - a);

  if (loading) return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>;

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <h1 className="page-title">Health Timeline</h1>
        <p className="page-subtitle">Your complete medical history, chronologically</p>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🕐</div>
          <div className="empty-title">No records in timeline</div>
          <div className="empty-desc">Upload medical records with dates to see them on your timeline</div>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {years.map(year => (
            <div key={year} style={{ marginBottom: 40 }}>
              {/* Year Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
              }}>
                <div style={{
                  background: 'var(--grad-teal)', borderRadius: 'var(--radius-md)',
                  padding: '4px 16px', fontWeight: 800, fontSize: 16, color: '#fff',
                  boxShadow: 'var(--shadow-teal)',
                }}>
                  {year}
                </div>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{grouped[year].length} record{grouped[year].length !== 1 ? 's' : ''}</div>
              </div>

              {/* Events */}
              <div style={{ paddingLeft: 28, position: 'relative' }}>
                {/* Vertical line */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: 2, background: 'var(--border)',
                }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {grouped[year].map((record, i) => (
                    <div key={record.id} style={{ position: 'relative', display: 'flex', gap: 20 }}>
                      {/* Dot on timeline */}
                      <div style={{
                        position: 'absolute',
                        left: -35, top: 16,
                        width: 14, height: 14,
                        borderRadius: '50%',
                        background: CATEGORY_COLORS[record.category] || '#6b7280',
                        border: '3px solid var(--bg-base)',
                        boxShadow: `0 0 0 2px ${CATEGORY_COLORS[record.category]}33`,
                        flexShrink: 0,
                      }} />

                      {/* Card */}
                      <div className="card" style={{ flex: 1, padding: '16px 20px', cursor: 'pointer' }}
                        onClick={() => window.location.href = `/records/${record.id}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 24 }}>{CATEGORY_ICONS[record.category]}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>{record.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                              {record.record_date ? format(new Date(record.record_date + 'T00:00:00'), 'MMMM d, yyyy') : 'No date'}
                            </div>
                          </div>
                          <span className={`badge cat-${record.category}`}>{record.category}</span>
                        </div>
                        {record.description && (
                          <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {record.description.slice(0, 120)}{record.description.length > 120 ? '...' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Timeline;
