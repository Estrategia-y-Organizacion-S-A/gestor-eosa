import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Car, CalendarDays, Wrench, LogOut, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSystemSettings } from '../contexts/SystemSettingsContext';
import { NotificationsDropdown } from '../components/NotificationsDropdown';

export function MainLayout() {
  const location = useLocation();
  const { user, isAdmin, canManageGadgets, logout } = useAuth();
  const { isGadgetsMaintenance } = useSystemSettings();

  const canAccessGadgets = !isGadgetsMaintenance || canManageGadgets;
  
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/carpooling', label: 'Viajes', icon: Car },
    { to: '/desks', label: 'Puestos', icon: CalendarDays },
    ...(canAccessGadgets ? [
      { 
        to: '/gadgets', 
        label: 'Gadgets', 
        icon: Wrench,
        badge: (isGadgetsMaintenance && canManageGadgets) ? 'Mantenimiento' : null
      }
    ] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Toaster position="top-right" />
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            <Link 
              to="/" 
              className="flex items-center hover:opacity-90 transition-opacity focus:outline-none"
              title="EOSA - Ir al Dashboard"
            >
              <img src="/logo.png" alt="EOSA" className="h-9 w-auto" />
            </Link>

            <nav className="hidden md:flex space-x-2">
              {navItems.map((item) => {
                const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-red text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={clsx(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase",
                        isActive 
                          ? "bg-amber-400 text-gray-900" 
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="flex items-center gap-4">
              <NotificationsDropdown />
              
              {isAdmin && (
                <NavLink 
                  to="/admin"
                  className={({ isActive }) => clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors border",
                    isActive ? "bg-red-50 text-brand-red border-brand-red" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  )}
                  title="Panel de Administración"
                >
                  <Shield className="w-5 h-5 text-brand-red" />
                  <span className="text-sm font-bold text-gray-900 hidden sm:block">Admin</span>
                </NavLink>
              )}

              <NavLink 
                to="/profile"
                className={({ isActive }) => clsx(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors",
                  isActive ? "bg-brand-red/10 text-brand-red" : "hover:bg-gray-100 text-gray-700"
                )}
              >
                <div className="w-7 h-7 rounded-full bg-brand-red text-white flex items-center justify-center text-xs font-bold">
                  {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden sm:block">
                  {user?.displayName || user?.email?.split('@')[0] || 'Usuario'}
                </span>
              </NavLink>
              
              <button 
                onClick={() => logout()}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
