import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Prescription', 'Report', 'Scan', 'Vaccination', 'Lab', 'Other'];

const Upload = () => {
  const [form, setForm] = useState({
    title: '', category: 'Other', description: '', record_date: '', tags: '',
  });
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file'); return; }

    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
    formData.append('file', file);

    setLoading(true);
    setProgress(0);
    try {
      await api.post('/records', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      toast.success('Record uploaded successfully! 🎉');
      navigate('/records');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="page-content animate-in">
      <div className="page-header">
        <h1 className="page-title">Upload Medical Record</h1>
        <p className="page-subtitle">Securely store your medical documents in your vault</p>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Drop Zone */}
          <div
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragging ? 'var(--teal-500)' : file ? 'var(--teal-700)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'rgba(13, 148, 136, 0.06)' : file ? 'rgba(13, 148, 136, 0.04)' : 'var(--bg-card)',
              transition: 'all 0.2s ease',
            }}
            id="upload-dropzone"
          >
            <input
              ref={fileInputRef}
              type="file"
              id="upload-file"
              style={{ display: 'none' }}
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
            />

            {file ? (
              <div>
                <div style={{ fontSize: 48, marginBottom: 12 }}>
                  {file.type.includes('pdf') ? '📄' : file.type.includes('image') ? '🖼️' : '📎'}
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--teal-400)' }}>{file.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  {formatSize(file.size)} • Click to change
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📤</div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                  {dragging ? 'Drop file here' : 'Drag & drop or click to upload'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  PDF, Images (JPG, PNG), DOC, TXT — Max 50MB
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {loading && progress > 0 && (
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span>Uploading to secure vault...</span>
                <span style={{ color: 'var(--teal-400)' }}>{progress}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                <div style={{
                  height: '100%', width: `${progress}%`, borderRadius: 3,
                  background: 'var(--grad-teal)', transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="card" style={{ gap: 0 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>Record Details</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  id="upload-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Annual Blood Test Results, MRI Scan Report"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    id="upload-category"
                    className="form-select"
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Record Date</label>
                  <input
                    id="upload-date"
                    type="date"
                    className="form-input"
                    value={form.record_date}
                    onChange={e => setForm(p => ({ ...p, record_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea
                  id="upload-description"
                  className="form-textarea"
                  placeholder="Brief description of this document..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma separated, optional)</label>
                <input
                  id="upload-tags"
                  type="text"
                  className="form-input"
                  placeholder="e.g., diabetes, cardiology, annual"
                  value={form.tags}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="alert alert-info">
            <span>🔒</span>
            <span>Your file will be securely stored and only accessible by you. Files can be downloaded to your local disk anytime.</span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={loading || !file}
              id="upload-submit"
            >
              {loading ? <><span className="spinner spinner-sm" /> Uploading...</> : '🔒 Upload Securely'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;
