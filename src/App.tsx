import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { SystemSettingsProvider } from './contexts/SystemSettingsContext';

import { ErrorBoundary } from './components/ErrorBoundary';

const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const CarpoolingLayout = lazy(() => import('./features/carpooling/CarpoolingLayout').then(m => ({ default: m.CarpoolingLayout })));
const NewTripForm = lazy(() => import('./features/carpooling/NewTripForm').then(m => ({ default: m.NewTripForm })));
const DesksLayout = lazy(() => import('./features/desks/DesksLayout').then(m => ({ default: m.DesksLayout })));
const GadgetsLayout = lazy(() => import('./features/gadgets/GadgetsLayout').then(m => ({ default: m.GadgetsLayout })));
const Login = lazy(() => import('./features/auth/Login').then(m => ({ default: m.Login })));
const ProfileSettings = lazy(() => import('./features/profile/ProfileSettings').then(m => ({ default: m.ProfileSettings })));
const AdminPanel = lazy(() => import('./features/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));

function RouteFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" />
    </div>
  );
}

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

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" />
      </div>
    );
  }
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <ConfirmProvider>
      <AuthProvider>
        <SystemSettingsProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
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
                  <Route path="admin" element={<AdminRoute><ErrorBoundary fallbackTitle="Error en el Panel de Administración"><AdminPanel /></ErrorBoundary></AdminRoute>} />
                </Route>
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SystemSettingsProvider>
      </AuthProvider>
    </ConfirmProvider>
  );
}

export default App;
