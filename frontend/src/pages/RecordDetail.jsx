import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CATEGORY_ICONS = {
  Prescription: '💊', Report: '📄', Scan: '🩻', Vaccination: '💉', Lab: '🧪', Other: '📎',
};

const RecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [versions, setVersions] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareForm, setShareForm] = useState({ doctorEmail: '', expiresInHours: 48 });
  const [shareResult, setShareResult] = useState(null);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/records/${id}`);
      setRecord(data.record);
      setVersions(data.versions || []);
      setAiSummary(data.aiSummary);
    } catch {
      toast.error('Record not found');
      navigate('/records');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const { data } = await api.get(`/records/${id}/download`);
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = record.file_name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Downloading to your local disk...');
    } catch { toast.error('Download failed'); }
  };

  const handleAISummarize = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post(`/ai/summarize/${id}`);
      setAiSummary(data.summary);
      toast.success('AI summary generated!');
    } catch { toast.error('AI summarization failed'); }
    finally { setAiLoading(false); }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    setShareLoading(true);
    try {
      const { data } = await api.post('/share', {
        recordId: id,
        doctorEmail: shareForm.doctorEmail,
        expiresInHours: shareForm.expiresInHours,
      });
      setShareResult(data);
      toast.success('Share link created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create share link');
    } finally { setShareLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this record? This cannot be undone.')) return;
    try {
      await api.delete(`/records/${id}?permanent=true`);
      toast.success('Record deleted');
      navigate('/records');
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>;
  if (!record) return null;

  return (
    <div className="page-content animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <Link to="/records" className="btn btn-ghost btn-sm">← Back</Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 28 }}>{CATEGORY_ICONS[record.category]}</span>
            <h1 className="page-title" style={{ margin: 0 }}>{record.title}</h1>
            <span className={`badge cat-${record.category}`}>{record.category}</span>
            {record.version > 1 && <span className="badge badge-info">v{record.version}</span>}
          </div>
          <p className="page-subtitle">
            {record.record_date ? format(new Date(record.record_date + 'T00:00:00'), 'MMMM d, yyyy') : 'No date'} •
            Uploaded {format(new Date(record.created_at), 'MMM d, yyyy')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={handleDownload} id="download-btn">
            ⬇️ Download
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowShareModal(true)} id="share-btn">
            🔗 Share
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete} id="delete-btn">
            🗑️
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Record Info */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Record Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'File Name', value: record.file_name },
                { label: 'File Type', value: record.file_type },
                { label: 'File Size', value: record.file_size ? `${(record.file_size / 1024 / 1024).toFixed(2)} MB` : '—' },
                { label: 'Version', value: `v${record.version}` },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{item.value || '—'}</div>
                </div>
              ))}
            </div>

            {record.description && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Description</div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{record.description}</p>
              </div>
            )}

            {record.tags?.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {record.tags.map(tag => <span key={tag} className="badge badge-teal">{tag}</span>)}
              </div>
            )}
          </div>

          {/* AI Summary */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <h3 style={{ fontWeight: 700 }}>AI Health Summary</h3>
                <span className="badge badge-purple">Groq AI</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleAISummarize}
                disabled={aiLoading}
                id="ai-summarize-btn"
              >
                {aiLoading ? <span className="spinner spinner-sm" /> : aiSummary ? '🔄 Regenerate' : '✨ Generate Summary'}
              </button>
            </div>

            {aiSummary ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Summary</h4>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{aiSummary.summary}</p>
                </div>

                {aiSummary.key_findings?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Key Findings</h4>
                    <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {aiSummary.key_findings.map((f, i) => (
                        <li key={i} style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiSummary.abnormal_values?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', marginBottom: 8 }}>⚠️ Abnormal Values</h4>
                    {aiSummary.abnormal_values.map((v, i) => (
                      <div key={i} className="alert alert-warning" style={{ marginBottom: 6, fontSize: 13 }}>{v}</div>
                    ))}
                  </div>
                )}

                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                  ⚕️ {aiSummary.disclaimer}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
                <p style={{ fontSize: 14 }}>Generate an AI-powered summary of this medical record</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Version History */}
          {versions.length > 0 && (
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Version History</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(13, 148, 136, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hover)' }}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>v{record.version} (Current)</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{format(new Date(record.updated_at), 'MMM d, yyyy')}</div>
                  </div>
                  <span className="badge badge-teal">Current</span>
                </div>
                {versions.map(v => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13 }}>v{v.version}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{format(new Date(v.created_at), 'MMM d, yyyy')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiry */}
          {record.expires_at && (
            <div className="alert alert-warning">
              <span>⏱</span>
              <span style={{ fontSize: 13 }}>Expires {format(new Date(record.expires_at), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => { setShowShareModal(false); setShareResult(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🔗 Share Record</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => { setShowShareModal(false); setShareResult(null); }}>✕</button>
            </div>

            {shareResult ? (
              <div>
                <div className="alert alert-success" style={{ marginBottom: 16 }}>
                  ✅ Share link created! An OTP has been sent to the doctor's email.
                </div>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px 14px', wordBreak: 'break-all', fontSize: 13, color: 'var(--teal-400)', marginBottom: 12 }}>
                  {shareResult.shareUrl}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => { navigator.clipboard.writeText(shareResult.shareUrl); toast.success('Copied!'); }}
                    style={{ flex: 1 }}
                  >
                    📋 Copy Link
                  </button>
                  <button className="btn btn-primary" onClick={() => { setShowShareModal(false); setShareResult(null); }} style={{ flex: 1 }}>
                    Done
                  </button>
                </div>
                {shareResult._devOtp && (
                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--warning)', textAlign: 'center' }}>
                    🛠️ Dev OTP: <strong>{shareResult._devOtp}</strong>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleShare}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Doctor's Email *</label>
                    <input
                      id="share-email"
                      type="email"
                      className="form-input"
                      placeholder="doctor@hospital.com"
                      value={shareForm.doctorEmail}
                      onChange={e => setShareForm(p => ({ ...p, doctorEmail: e.target.value }))}
                      required
                    />
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      An OTP will be emailed to the doctor for secure access
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Link Expires In</label>
                    <select
                      className="form-select"
                      value={shareForm.expiresInHours}
                      onChange={e => setShareForm(p => ({ ...p, expiresInHours: Number(e.target.value) }))}
                    >
                      <option value={24}>24 hours</option>
                      <option value={48}>48 hours</option>
                      <option value={168}>1 week</option>
                      <option value={720}>30 days</option>
                    </select>
                  </div>
                  <div className="alert alert-info" style={{ fontSize: 13 }}>
                    🔒 The doctor must verify with an OTP sent to their email before viewing.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowShareModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={shareLoading} id="share-submit">
                      {shareLoading ? <span className="spinner spinner-sm" /> : '🔗 Create Share Link'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordDetail;
