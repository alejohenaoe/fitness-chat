import { Outlet, Link, useLocation } from 'react-router-dom';
import { DashboardPanel } from '../dashboard/DashboardPanel';
import { MessageSquare, History, User, Sparkles, LogOut } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const navItems = [
  { to: '/', label: 'Chat', icon: MessageSquare },
  { to: '/history', label: 'Historial', icon: History },
  { to: '/profile', label: 'Perfil', icon: User },
];

export const MainLayout = () => {
  const location = useLocation();
  const { user, logout } = useAppStore();

  return (
    <div className="flex h-screen bg-surface-950 bg-mesh text-surface-50">
      <aside className="noise hidden w-60 border-r border-white/5 bg-surface-900/60 p-4 md:flex md:flex-col">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">FitnessChat</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-surface-100 hover:bg-white/5 hover:text-surface-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-white/5 pt-3 mt-2">
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
              {(user?.first_name || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate text-sm font-medium">{user?.first_name || 'Usuario'}</span>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-surface-100 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto"><Outlet /></main>
      <DashboardPanel />
    </div>
  );
};
