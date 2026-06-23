import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      toast.success('Account created! Welcome to MediVault 🏥');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">🏥</div>
            <div className="auth-logo-text">MediVault</div>
          </div>

          <h1 className="auth-title">Create Your Vault</h1>
          <p className="auth-sub">Secure your medical records forever</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                id="register-name"
                type="text"
                className="form-input"
                placeholder="Dr. Jane Doe"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="register-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="register-password"
                type="password"
                className="form-input"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">I am a...</label>
              <div className="role-selector">
                {['patient', 'doctor'].map(role => (
                  <button
                    key={role}
                    type="button"
                    className={`role-btn ${form.role === role ? 'active' : ''}`}
                    onClick={() => setForm(p => ({ ...p, role }))}
                    id={`role-${role}`}
                  >
                    {role === 'patient' ? '🤒 Patient' : '👨‍⚕️ Doctor'}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading} id="register-submit">
              {loading ? <span className="spinner spinner-sm" /> : '→ Create Account'}
            </button>
          </form>

          <div className="auth-divider"><span>Already have an account?</span></div>
          <Link to="/login" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center' }}>
            Sign In
          </Link>

          <div className="auth-disclaimer">
            🔒 By registering, you agree to keep your credentials private.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
