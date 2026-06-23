import { useState, useEffect } from 'react';
import api from '../services/api';
import { format } from 'date-fns';

const ACTION_ICONS = {
  LOGIN: '🔐', LOGOUT: '🚪', REGISTER: '✅', UPLOAD_RECORD: '📤',
  VIEW_RECORD: '👁️', DOWNLOAD_RECORD: '⬇️', UPDATE_RECORD: '✏️',
  DELETE_RECORD: '🗑️', ARCHIVE_RECORD: '📦', VERSION_RECORD: '🔄',
  CREATE_SHARE_LINK: '🔗', REVOKE_SHARE_LINK: '❌', DOCTOR_ACCESS: '👨‍⚕️',
  AI_SUMMARIZE: '🤖', AI_CHAT: '💬', CREATE_APPOINTMENT: '📅', CHANGE_PASSWORD: '🔒',
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/audit', { params: { page, limit: 30 } })
      .then(res => { setLogs(res.data.logs || []); setTotal(res.data.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>;

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-subtitle">{total} total events — Complete activity history</p>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No audit logs yet</div>
          <div className="empty-desc">Your activity history will appear here</div>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{ACTION_ICONS[log.action] || '📌'}</span>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{log.action.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {log.resource_type && <span className="badge badge-gray">{log.resource_type}</span>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200 }}>
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <span>{Object.entries(log.details).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {log.ip_address || '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 30 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                Page {page} of {Math.ceil(total / 30)}
              </span>
              <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / 30)} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLogs;
