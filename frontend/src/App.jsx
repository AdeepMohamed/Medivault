import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import RecordDetail from './pages/RecordDetail';
import Upload from './pages/Upload';
import Timeline from './pages/Timeline';
import Medications from './pages/Medications';
import Appointments from './pages/Appointments';
import AIAssistant from './pages/AIAssistant';
import SharedLinks from './pages/SharedLinks';
import Profile from './pages/Profile';
import AuditLogs from './pages/AuditLogs';
import DoctorAccess from './pages/DoctorAccess';
import AdminDashboard from './pages/AdminDashboard';

import { useAuth } from './contexts/AuthContext';

const AppLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {children}
        <footer style={{
          padding: '20px 32px',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border)',
          marginTop: 'auto',
          background: 'transparent'
        }}>
          Developed by <span style={{ color: 'var(--teal-400)', fontWeight: 600 }}>Adeep Mohamed</span>
        </footer>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, []);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/access/:token" element={<DoctorAccess />} />

      {/* Protected - Patient */}
      <Route path="/dashboard" element={
        <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
      } />
      <Route path="/records" element={
        <ProtectedRoute><AppLayout><Records /></AppLayout></ProtectedRoute>
      } />
      <Route path="/records/:id" element={
        <ProtectedRoute><AppLayout><RecordDetail /></AppLayout></ProtectedRoute>
      } />
      <Route path="/upload" element={
        <ProtectedRoute><AppLayout><Upload /></AppLayout></ProtectedRoute>
      } />
      <Route path="/timeline" element={
        <ProtectedRoute><AppLayout><Timeline /></AppLayout></ProtectedRoute>
      } />
      <Route path="/medications" element={
        <ProtectedRoute><AppLayout><Medications /></AppLayout></ProtectedRoute>
      } />
      <Route path="/appointments" element={
        <ProtectedRoute><AppLayout><Appointments /></AppLayout></ProtectedRoute>
      } />
      <Route path="/ai-assistant" element={
        <ProtectedRoute><AppLayout><AIAssistant /></AppLayout></ProtectedRoute>
      } />
      <Route path="/share" element={
        <ProtectedRoute><AppLayout><SharedLinks /></AppLayout></ProtectedRoute>
      } />
      <Route path="/audit" element={
        <ProtectedRoute><AppLayout><AuditLogs /></AppLayout></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <AppLayout><AdminDashboard /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
