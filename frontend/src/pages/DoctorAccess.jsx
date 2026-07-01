import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import axios from 'axios';

const CATEGORY_ICONS = {
  Prescription: '💊', Report: '📄', Scan: '🩻', Vaccination: '💉', Lab: '🧪', Other: '📎',
};

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DoctorAccess = () => {
  const { token } = useParams();
  const [meta, setMeta] = useState(null);
  const [stage, setStage] = useState('loading'); // loading | enter-otp | verifying | viewing | error
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [viewToken, setViewToken] = useState(null);
  const [record, setRecord] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    axios.get(`${BASE_URL}/share/${token}/meta`)
      .then(res => {
        setMeta(res.data);
        setStage('enter-otp');
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Invalid or expired link');
        setStage('error');
      });
  }, [token]);

  const verifyOTP = async (e) => {
    e.preventDefault();
    setStage('verifying');
    try {
      const { data } = await axios.post(`${BASE_URL}/share/${token}/verify`, { otp, doctorEmail: email });
      setViewToken(data.viewToken);

      // Fetch the record
      const recRes = await axios.get(`${BASE_URL}/share/${token}/record`, {
        headers: { 'x-view-token': data.viewToken },
      });
      setRecord(recRes.data.record);
      setAiSummary(recRes.data.aiSummary);
      setStage('viewing');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
      setStage('enter-otp');
      toast.error(err.response?.data?.error || 'Invalid OTP');
    }
  };

  const resendOTP = async () => {
    setResending(true);
    try {
      const res = await axios.post(`${BASE_URL}/share/${token}/resend-otp`, { doctorEmail: email });
      toast.success('OTP resent to your email!');
      if (res.data._devOtp) toast(`Dev OTP: ${res.data._devOtp}`, { icon: '🛠️' });
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  if (stage === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Access Denied</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
          <div className="alert alert-error">{error}</div>
        </div>
      </div>
    );
  }

  if (stage === 'enter-otp' || stage === 'verifying') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🏥</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>MediVault</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Secure Medical Record Access</p>
          </div>

          <div className="card">
            {meta && (
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{meta.recordTitle}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {meta.recordCategory} • {meta.recordDate ? format(new Date(meta.recordDate + 'T00:00:00'), 'MMM d, yyyy') : 'No date'}
                </div>
                {meta.expiresAt && (
                  <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 6 }}>
                    ⏱ Link expires: {format(new Date(meta.expiresAt), 'MMM d, yyyy HH:mm')}
                  </div>
                )}
              </div>
            )}

            <h2 style={{ fontWeight: 700, marginBottom: 6 }}>Enter Access OTP</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Enter the 6-digit OTP sent to your email address to access this medical record.
            </p>

            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <form onSubmit={verifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Your Email</label>
                <input
                  id="doctor-email"
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">One-Time Password (OTP)</label>
                <input
                  id="doctor-otp"
                  type="text"
                  className="form-input"
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: 700 }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" id="verify-otp-btn" disabled={stage === 'verifying' || otp.length < 6}>
                {stage === 'verifying' ? <><span className="spinner spinner-sm" /> Verifying...</> : '🔓 Access Record'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={resendOTP} disabled={resending} style={{ alignSelf: 'center' }}>
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Viewing stage
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 32 }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '14px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <span style={{ fontSize: 28 }}>🏥</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>MediVault — Secure Medical Record</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>This is a read-only shared view. Expires with the share link.</div>
          </div>
          <span className="badge badge-success" style={{ marginLeft: 'auto' }}>🔓 Verified</span>
        </div>

        {/* Record */}
        {record && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 32 }}>{CATEGORY_ICONS[record.category]}</span>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700 }}>{record.title}</h1>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <span className={`badge cat-${record.category}`}>{record.category}</span>
                  {record.record_date && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{format(new Date(record.record_date + 'T00:00:00'), 'MMMM d, yyyy')}</span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>File</div>
                <div style={{ fontSize: 14 }}>{record.file_name}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</div>
                <div style={{ fontSize: 14 }}>{record.file_type}</div>
              </div>
            </div>

            {record.description && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Description</div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{record.description}</p>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <a href={record.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" id="doctor-view-file">
                👁️ View Document
              </a>
            </div>
          </div>
        )}

        {/* AI Summary */}
        {aiSummary && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span>🤖</span>
              <h3 style={{ fontWeight: 700 }}>AI Health Summary</h3>
              <span className="badge badge-purple">Groq AI</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>{aiSummary.summary}</p>
            {aiSummary.key_findings?.length > 0 && (
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {aiSummary.key_findings.map((f, i) => <li key={i} style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{f}</li>)}
              </ul>
            )}
            <div style={{ marginTop: 12, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
              ⚕️ {aiSummary.disclaimer}
            </div>
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          This is a time-limited, read-only view shared by the patient. MediVault does not share your access information.
        </div>
      </div>
    </div>
  );
};

export default DoctorAccess;
