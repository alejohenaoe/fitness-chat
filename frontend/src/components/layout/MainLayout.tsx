import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, TrendingUp, BarChart3, User, LogOut } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const sidebarItems = [
  { to: '/', label: 'Chat', icon: MessageSquare },
  { to: '/progress', label: 'Progreso', icon: TrendingUp },
  { to: '/history', label: 'Historial', icon: BarChart3 },
  { to: '/profile', label: 'Perfil', icon: User },
];

const bottomTabs = [
  { to: '/', label: 'Chat', icon: MessageSquare },
  { to: '/progress', label: 'Progreso', icon: TrendingUp },
  { to: '/history', label: 'Tendencias', icon: BarChart3 },
  { to: '/profile', label: 'Perfil', icon: User },
];

export const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAppStore();

  return (
    <div className="flex min-h-dvh bg-white text-surface-50">
      {/* Sidebar - desktop only */}
      <aside className="hidden w-60 flex-col border-r border-[#E5E7EB] bg-surface-900 p-4 pt-[env(safe-area-inset-top)] lg:flex">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden">
            <img src="/logo-app.png" alt="FitnessChat" className="h-full w-full object-cover" />
          </div>
          <span className="text-lg font-bold text-surface-50">FitnessChat</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-500/10 text-brand-500'
                    : 'text-surface-100 hover:bg-black/5 hover:text-surface-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-[#E5E7EB] pt-3">
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-500">
              {(user?.first_name || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate text-sm font-medium text-surface-50">{user?.first_name || 'Usuario'}</span>
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] lg:pb-0">
        <Outlet />
      </main>

      {/* Bottom tab bar - mobile & tablet */}
      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-[#E5E7EB] bg-surface-900 pb-[env(safe-area-inset-bottom)] lg:hidden">
        {bottomTabs.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.to)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-all ${
                active ? 'text-brand-500' : 'text-surface-700'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
