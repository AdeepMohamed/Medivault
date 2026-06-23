import { useState, useEffect } from 'react';
import api from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { QRCodeSVG as QRCode } from 'qrcode.react';

const SharedLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(null);

  const load = () => {
    api.get('/share/my/links').then(r => setLinks(r.data.links || [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const revokeLink = async (id) => {
    if (!window.confirm('Revoke this share link? The doctor will no longer be able to access it.')) return;
    try {
      await api.delete(`/share/${id}/revoke`);
      toast.success('Link revoked');
      load();
    } catch { toast.error('Failed to revoke'); }
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  const FRONTEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5173';

  if (loading) return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>;

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <h1 className="page-title">Shared Links</h1>
        <p className="page-subtitle">Manage links you've shared with doctors</p>
      </div>

      {links.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <div className="empty-title">No shared links yet</div>
          <div className="empty-desc">Open a record and use the Share button to create a secure link for a doctor</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Record</th>
                <th>Doctor Email</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Access</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map(link => {
                const shareUrl = `${FRONTEND_URL}/access/${link.token}`;
                const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
                const isRevoked = link.is_revoked;
                const status = isRevoked ? 'Revoked' : isExpired ? 'Expired' : 'Active';

                return (
                  <tr key={link.id}>
                    <td style={{ fontWeight: 600, maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {link.records?.title || 'Unknown'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{link.records?.category}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{link.doctor_email || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {format(new Date(link.created_at), 'MMM d, yyyy')}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {link.expires_at ? format(new Date(link.expires_at), 'MMM d, yyyy') : 'No expiry'}
                    </td>
                    <td>
                      <span style={{ fontSize: 13 }}>{link.access_count} / {link.max_access_count}</span>
                    </td>
                    <td>
                      <span className={`badge ${status === 'Active' ? 'badge-success' : status === 'Revoked' ? 'badge-error' : 'badge-warning'}`}>
                        {status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Copy link"
                          onClick={() => copyLink(shareUrl)}
                          id={`copy-link-${link.id}`}
                        >📋</button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Show QR"
                          onClick={() => setQrModal({ url: shareUrl, title: link.records?.title })}
                        >📱</button>
                        {!isRevoked && !isExpired && (
                          <button
                            className="btn btn-danger btn-sm"
                            title="Revoke"
                            onClick={() => revokeLink(link.id)}
                            id={`revoke-${link.id}`}
                          >Revoke</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="modal-overlay" onClick={() => setQrModal(null)}>
          <div className="modal" style={{ maxWidth: 360, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📱 QR Code</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setQrModal(null)}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{qrModal.title}</p>
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20, background: '#fff', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
              <QRCode value={qrModal.url} size={200} fgColor="#0d9488" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{qrModal.url}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => copyLink(qrModal.url)}>📋 Copy Link</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setQrModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedLinks;
