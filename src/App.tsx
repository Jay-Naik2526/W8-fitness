import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// --- COMPONENTS ---
import Navigation from './components/Navigation';

// --- IMPORT ADMIN PAGES ---
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClients from './pages/admin/AdminClients';
import AdminTrainers from './pages/admin/AdminTrainers';
import AdminMembership from './pages/admin/AdminMembership';

// --- IMPORT TRAINER PAGES ---
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import TrainerClientManager from './pages/trainer/TrainerClientManager';

// --- IMPORT CLIENT PAGES ---
import Dashboard from './pages/client/Dashboard';
import Architect from './pages/client/Architect';
import Fuel from './pages/client/Fuel';
import Oracle from './pages/client/Oracle';
import Profile from './pages/client/Profile';
import Protocols from './pages/client/Protocols';
import Report from './pages/client/Report';
import Settings from './pages/client/Settings';

// --- IMPORT PUBLIC PAGES ---
import LandingPage from './pages/public/LandingPage';
import Login from './pages/public/Login';

// --- SECURITY WRAPPER (THE GATEKEEPER) ---
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[]; // e.g. ['admin'] or ['client', 'trainer']
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem('w8_token');
  const userStr = localStorage.getItem('w8_user');

  // 1. Not Logged In? -> Go to Login
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    const userRole = user.role ? user.role.toLowerCase() : 'client'; // Normalize to lowercase

    // 2. Wrong Role? -> Go to YOUR Dashboard
    // Example: If I am a 'client' trying to access an 'admin' page, this block runs.
    if (!allowedRoles.includes(userRole)) {
      if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
      if (userRole === 'trainer') return <Navigate to="/trainer/dashboard" replace />;
      return <Navigate to="/dashboard" replace />;
    }

    // 3. Authorized -> Render Page
    return <>{children}</>;

  } catch (error) {
    // If local storage is corrupted
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
};

function App() {
  const location = useLocation();

  // Hide Navigation on specific pages
  const hideNav = 
    location.pathname === '/' || 
    location.pathname === '/login' || 
    location.pathname === '/oracle' || // <--- ADDED THIS LINE
    location.pathname.startsWith('/trainer') || 
    location.pathname.startsWith('/admin');

  return (
    <div className="App relative min-h-screen bg-black text-white">
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        {/* --- CLIENT ROUTES (Only 'client' can access) --- */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['client']}><Dashboard /></ProtectedRoute>} />
        <Route path="/build" element={<ProtectedRoute allowedRoles={['client']}><Architect /></ProtectedRoute>} />
        <Route path="/fuel" element={<ProtectedRoute allowedRoles={['client']}><Fuel /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute allowedRoles={['client']}><Report /></ProtectedRoute>} />
        <Route path="/id" element={<ProtectedRoute allowedRoles={['client']}><Profile /></ProtectedRoute>} />
        
        <Route path="/oracle" element={<ProtectedRoute allowedRoles={['client']}><Oracle /></ProtectedRoute>} />
        <Route path="/protocols" element={<ProtectedRoute allowedRoles={['client']}><Protocols /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['client']}><Settings /></ProtectedRoute>} />

        {/* --- ADMIN ROUTES (Only 'admin' can access) --- */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/clients" element={<ProtectedRoute allowedRoles={['admin']}><AdminClients /></ProtectedRoute>} />
        <Route path="/admin/trainers" element={<ProtectedRoute allowedRoles={['admin']}><AdminTrainers /></ProtectedRoute>} />
        <Route path="/admin/membership" element={<ProtectedRoute allowedRoles={['admin']}><AdminMembership /></ProtectedRoute>} />

        {/* --- TRAINER ROUTES (Only 'trainer' can access) --- */}
        <Route path="/trainer/dashboard" element={<ProtectedRoute allowedRoles={['trainer']}><TrainerDashboard /></ProtectedRoute>} />
        <Route path="/trainer/clients" element={<ProtectedRoute allowedRoles={['trainer']}><TrainerClientManager /></ProtectedRoute>} />

        {/* --- CATCH ALL --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Navigation Bar (Hidden for Admin/Trainer/Oracle) */}
      {!hideNav && <Navigation />}
    </div>
  );
}

export default App;