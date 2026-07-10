import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, TrendingUp, BarChart3, History, User, Plus, LogOut, X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const navItems = [
  { to: '/', label: 'Chat', icon: MessageSquare },
  { to: '/progress', label: 'Progreso', icon: TrendingUp },
  { to: '/history', label: 'Tendencias', icon: BarChart3 },
  { to: '/sessions', label: 'Historial', icon: History },
  { to: '/profile', label: 'Perfil', icon: User },
];

export const Drawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const { user, logout, setMessages, setCurrentSessionId } = useAppStore();

  const handleNav = (to: string) => {
    onClose();
    navigate(to);
  };

  const handleNewChat = () => {
    onClose();
    setMessages([]);
    setCurrentSessionId(null);
    navigate('/');
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-40 flex h-full w-3/4 max-w-sm flex-col border-r border-[#E5E7EB] bg-white shadow-xl"
          >
            <div className="flex items-center justify-between p-4 pt-[env(safe-area-inset-top)]">
              <div className="flex items-center gap-2">
                <img src="/fitnesschat-logo.png" alt="" className="h-6 w-6" />
                <span className="text-lg font-bold text-surface-50">FitnessChat</span>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-900">
                <X className="h-5 w-5 text-surface-100" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 px-3">
              {navItems.map((item) => (
                <button
                  key={item.to}
                  onClick={() => handleNav(item.to)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-50 transition-all hover:bg-surface-900"
                >
                  <item.icon className="h-4 w-4 text-surface-100" />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="mx-4 mt-2 border-t border-[#E5E7EB]" />

            <button
              onClick={handleNewChat}
              className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-2.5 text-sm font-medium text-surface-50 transition-all hover:bg-surface-900"
            >
              <Plus className="h-4 w-4 text-brand-500" />
              Nuevo chat
            </button>

            <div className="flex-1" />

            <div className="mx-4 border-t border-[#E5E7EB]" />

            <div className="p-4">
              <div className="mb-2 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-500">
                  {(user?.first_name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 truncate text-sm font-medium text-surface-50">
                  {user?.first_name || 'Usuario'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
