import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './features/dashboard/Dashboard';
import { CarpoolingLayout } from './features/carpooling/CarpoolingLayout';
import { NewTripForm } from './features/carpooling/NewTripForm';
import { DesksLayout } from './features/desks/DesksLayout';
import { GadgetsLayout } from './features/gadgets/GadgetsLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { Login } from './features/auth/Login';
import { ProfileSettings } from './features/profile/ProfileSettings';
import { AdminPanel } from './features/admin/AdminPanel';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <ConfirmProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="carpooling" element={<CarpoolingLayout />}>
              <Route path="new" element={<NewTripForm />} />
            </Route>
            <Route path="desks" element={<DesksLayout />} />
            <Route path="gadgets" element={<GadgetsLayout />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ConfirmProvider>
  );
}

export default App;
