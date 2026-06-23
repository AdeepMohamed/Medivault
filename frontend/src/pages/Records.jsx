import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Prescription', 'Report', 'Scan', 'Vaccination', 'Lab', 'Other'];

const CATEGORY_ICONS = {
  Prescription: '💊', Report: '📄', Scan: '🩻', Vaccination: '💉', Lab: '🧪', Other: '📎',
};

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Records = () => {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, archived: archived.toString() };
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      const { data } = await api.get('/records', { params });
      setRecords(data.records || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, category, archived]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleDownload = async (id, fileName) => {
    try {
      const { data } = await api.get(`/records/${id}/download`);
      // Trigger browser download to local disk
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = fileName || 'medical-record';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Downloading to your disk...');
    } catch { toast.error('Download failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Archive this record? You can restore it later.')) return;
    try {
      await api.delete(`/records/${id}`);
      toast.success('Record archived');
      load();
    } catch { toast.error('Failed to archive record'); }
  };

  return (
    <div className="page-content animate-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">My Records</h1>
          <p className="page-subtitle">{total} records total</p>
        </div>
        <Link to="/upload" className="btn btn-primary">+ Upload</Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
            <input
              id="records-search"
              type="text"
              className="form-input"
              placeholder="Search records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm">🔍</button>
          </form>

          {/* Category Filter */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-ghost'}`}
              >
                {cat !== 'All' ? CATEGORY_ICONS[cat] + ' ' : ''}{cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setArchived(!archived); setPage(1); }}
            className={`btn btn-sm ${archived ? 'btn-warning' : 'btn-ghost'}`}
            style={archived ? { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' } : {}}
          >
            {archived ? '📦 Archived' : '📂 Active'}
          </button>
        </div>
      </div>

      {/* Records Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <div className="empty-title">{archived ? 'No archived records' : 'No records found'}</div>
          <div className="empty-desc">
            {archived ? 'No records have been archived' : 'Upload your first medical document to get started'}
          </div>
          {!archived && (
            <Link to="/upload" className="btn btn-primary" style={{ marginTop: 16 }}>Upload First Record</Link>
          )}
        </div>
      ) : (
        <>
          <div className="records-grid">
            {records.map(record => (
              <div key={record.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 22, flexShrink: 0,
                  }}>
                    {CATEGORY_ICONS[record.category] || '📎'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {record.title}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      <span className={`badge cat-${record.category}`}>{record.category}</span>
                      {record.version > 1 && <span className="badge badge-info">v{record.version}</span>}
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {record.record_date && (
                    <span>📅 {format(new Date(record.record_date + 'T00:00:00'), 'MMMM d, yyyy')}</span>
                  )}
                  <span>📄 {record.file_name} ({formatSize(record.file_size)})</span>
                  <span>🕐 Uploaded {format(new Date(record.created_at), 'MMM d, yyyy')}</span>
                </div>

                {record.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {record.description.slice(0, 100)}{record.description.length > 100 ? '...' : ''}
                  </p>
                )}

                {/* Tags */}
                {record.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {record.tags.map(tag => (
                      <span key={tag} className="badge badge-teal">{tag}</span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <Link to={`/records/${record.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                    View
                  </Link>
                  <button
                    onClick={() => handleDownload(record.id, record.file_name)}
                    className="btn btn-ghost btn-sm"
                    title="Download to local disk"
                    id={`download-${record.id}`}
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="btn btn-ghost btn-sm"
                    title="Archive"
                    id={`archive-${record.id}`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Prev
              </button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                Page {page} of {Math.ceil(total / LIMIT)}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= Math.ceil(total / LIMIT)}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Records;
