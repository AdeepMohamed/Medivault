import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/records', icon: '📁', label: 'My Records' },
  { path: '/timeline', icon: '🕐', label: 'Health Timeline' },
  { path: '/medications', icon: '💊', label: 'Medications' },
  { path: '/appointments', icon: '📅', label: 'Appointments' },
  { path: '/ai-assistant', icon: '🤖', label: 'AI Assistant' },
  { path: '/share', icon: '🔗', label: 'Shared Links' },
  { path: '/audit', icon: '📋', label: 'Audit Logs' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

const ADMIN_ITEMS = [
  { path: '/admin', icon: '🛡️', label: 'Admin Panel' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MV';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏥</div>
        <div>
          <div className="sidebar-logo-name">MediVault</div>
          <div className="sidebar-logo-sub">Medical Record Locker</div>
        </div>
      </div>

      {/* User Info */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-role">{user?.role}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Navigation</div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="sidebar-nav-label" style={{ marginTop: 16 }}>Admin</div>
            {ADMIN_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout">
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
