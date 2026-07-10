import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { MessageSquare, TrendingUp, BarChart3, User, LogOut, Menu, ListTodo } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { Drawer } from '../chat/Drawer';
import { EntriesPanel } from '../chat/EntriesPanel';

const sidebarItems = [
  { to: '/', label: 'Chat', icon: MessageSquare },
  { to: '/progress', label: 'Progreso', icon: TrendingUp },
  { to: '/history', label: 'Historial', icon: BarChart3 },
  { to: '/sessions', label: 'Sesiones', icon: MessageSquare },
  { to: '/profile', label: 'Perfil', icon: User },
];

const pageTitles: Record<string, string> = {
  '/': 'FitnessChat',
  '/progress': 'Progreso',
  '/history': 'Tendencias',
  '/sessions': 'Historial',
  '/profile': 'Perfil',
};

export const MainLayout = () => {
  const location = useLocation();
  const { user, logout, navDrawerOpen, toggleNavDrawer, setNavDrawerOpen, toggleEntries, todayMeals, todayExercises } = useAppStore();
  const totalEntries = todayMeals.length + todayExercises.length;

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => document.documentElement.style.setProperty('--app-height', `${vv.height}px`);
    update();
    vv.addEventListener('resize', update);
    return () => vv.removeEventListener('resize', update);
  }, []);

  return (
    <div className="flex flex-col bg-white text-surface-50" style={{ height: 'var(--app-height, 100dvh)' }}>
      {/* Mobile top bar */}
      <div className="flex items-center border-b border-[#E5E7EB] bg-white px-4 py-3 lg:hidden">
        <button
          onClick={toggleNavDrawer}
          className="rounded-lg p-1.5 hover:bg-surface-900"
        >
          <Menu className="h-5 w-5 text-brand-500" />
        </button>
        <span className="ml-3 text-sm font-bold text-surface-50">
          {pageTitles[location.pathname] || 'FitnessChat'}
        </span>
        <button
          onClick={toggleEntries}
          className="ml-auto relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-surface-100 transition-all hover:bg-surface-900"
        >
          <ListTodo className="h-4 w-4" />
          <span className="hidden sm:inline">Registros</span>
          {totalEntries > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
              {totalEntries}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar - desktop only */}
        <aside className="hidden w-60 flex-col border-r border-[#E5E7EB] bg-surface-900 p-4 pt-[calc(env(safe-area-inset-top)+0.25rem)] lg:flex">
        <div className="mb-8 flex items-center gap-2.5 pt-3">
          <img src="/fitnesschat-logo.png" alt="" className="h-8 w-8" />
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
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Navigation drawer - mobile */}
      <Drawer isOpen={navDrawerOpen} onClose={() => setNavDrawerOpen(false)} />
      <EntriesPanel />
    </div>
  );
};
