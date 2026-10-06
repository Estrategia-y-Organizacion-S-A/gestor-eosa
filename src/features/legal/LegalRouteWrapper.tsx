import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Footer } from '../../components/Footer';
import { MainLayout } from '../../layouts/MainLayout';
import { LogIn } from 'lucide-react';

export function LegalRouteWrapper() {
  const { user } = useAuth();

  // Si el usuario ha iniciado sesión, renderiza dentro de la experiencia completa de MainLayout
  if (user) {
    return <MainLayout />;
  }

  // Si el usuario es público / no ha iniciado sesión, ofrece cabecera corporativa y pie accesible
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/login" className="flex items-center hover:opacity-90 transition-opacity" title="EOSA">
              <img src="/logo.png" alt="EOSA" className="h-9 w-auto" />
            </Link>
            
            <Link 
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand-red hover:bg-[#a31b31] px-4 py-2 rounded-xl transition-all shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Acceder al Gestor</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
