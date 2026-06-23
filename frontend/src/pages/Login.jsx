import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
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

          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-sub">Sign in to your medical record vault</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="login-email"
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
                id="login-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading} id="login-submit">
              {loading ? <span className="spinner spinner-sm" /> : '→ Sign In'}
            </button>
          </form>

          <div className="auth-divider"><span>Don't have an account?</span></div>
          <Link to="/register" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center' }}>
            Create Account
          </Link>

          <div className="auth-disclaimer">
            🔒 Your records are encrypted and private.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
