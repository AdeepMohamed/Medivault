import { Link } from 'react-router-dom';
import './Landing.css';

const features = [
  { icon: '🔒', title: 'Bank-Grade Security', desc: 'JWT authentication, OTP verification, and encrypted storage.' },
  { icon: '🤖', title: 'AI Health Assistant', desc: 'Gemini-powered chatbot summarizes reports and answers health queries.' },
  { icon: '🔗', title: 'Secure Doctor Sharing', desc: 'Share records via OTP-protected links and QR codes.' },
  { icon: '📊', title: 'Health Timeline', desc: 'Visualize your medical history chronologically.' },
  { icon: '💊', title: 'Medication Tracker', desc: 'Track active medications and dosage schedules.' },
  { icon: '📅', title: 'Appointment Manager', desc: 'Manage and track all your doctor appointments.' },
];

const categories = ['Prescriptions', 'Lab Reports', 'Scans & X-Rays', 'Vaccinations', 'Discharge Summaries'];

const Landing = () => {
  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <span>🏥</span>
          <span>MediVault</span>
        </div>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-glow" />
        <div className="hero-glow-2" />
        <div className="landing-hero-content">
          <div className="hero-badge">
            <span>🏥</span>
            <span>Your Personal Medical Record Locker</span>
          </div>
          <h1 className="hero-title">
            Secure Your
            <span className="hero-title-gradient"> Health Records</span>
            <br />Forever
          </h1>
          <p className="hero-desc">
            Upload, organize, and share your medical records with doctors securely. 
            Powered by AI to summarize reports and assist with health questions.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              Start for Free →
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><strong>100%</strong><span>Private</span></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><strong>OTP</strong><span>Sharing</span></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><strong>AI</strong><span>Powered</span></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><strong>Free</strong><span>Forever</span></div>
          </div>
        </div>

        {/* Floating Preview Card */}
        <div className="hero-preview">
          <div className="preview-card">
            <div className="preview-header">
              <span>📊</span>
              <span>Health Dashboard</span>
              <span className="preview-dot" />
            </div>
            <div className="preview-stats">
              <div className="preview-stat-item">
                <div className="preview-stat-value">24</div>
                <div className="preview-stat-label">Records</div>
              </div>
              <div className="preview-stat-item">
                <div className="preview-stat-value">3</div>
                <div className="preview-stat-label">Shared</div>
              </div>
              <div className="preview-stat-item">
                <div className="preview-stat-value">8</div>
                <div className="preview-stat-label">Meds</div>
              </div>
            </div>
            {categories.map((cat, i) => (
              <div key={i} className="preview-record">
                <div className="preview-record-dot" style={{ animationDelay: `${i * 0.1}s` }} />
                <span>{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features" id="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-desc">A complete health record management platform built for patients.</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="cta-content">
          <h2>Ready to take control of your health records?</h2>
          <p>Create your free account and start organizing your medical history today.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-logo">🏥 MediVault</div>
        <p>© 2026 MediVault. Your personal medical record locker.</p>
        <p style={{ fontSize: '13px', marginTop: 12 }}>
          Developed by <span style={{ color: 'var(--teal-400)', fontWeight: 600 }}>Adeep Mohamed</span>
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 8 }}>
          ⚕️ MediVault is not a medical provider. Always consult a qualified healthcare professional.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
