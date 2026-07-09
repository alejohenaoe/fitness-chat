import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, LogOut, X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import api from '../../services/api';
import type { ChatSession } from '../../types';

export const Drawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { user, sessions, setSessions, currentSessionId, loadSessionMessages, setCurrentSessionId, setMessages, logout } = useAppStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && sessions.length === 0) loadSessions();
  }, [isOpen]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/chat/sessions/');
      setSessions(data);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleSelectSession = async (session: ChatSession) => {
    onClose();
    await loadSessionMessages(session.id);
  };

  const handleNewChat = () => {
    onClose();
    setMessages([]);
    setCurrentSessionId(null);
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getSessionTitle = (session: ChatSession) => {
    const msg = session.messages?.[0]?.content;
    if (msg) return msg.length > 40 ? msg.slice(0, 40) + '...' : msg;
    return `Sesión ${session.id}`;
  };

  const nonEmpty = sessions.filter(s => s.messages && s.messages.length > 0);

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
                <img src="/logo-app.png" alt="FitnessChat" className="h-5 w-5 rounded object-cover" />
                <span className="text-lg font-bold text-surface-50">FitnessChat</span>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-surface-900">
                <X className="h-5 w-5 text-surface-100" />
              </button>
            </div>

            <button
              onClick={handleNewChat}
              className="mx-4 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-2.5 text-sm font-medium text-surface-50 transition-all hover:bg-surface-900"
            >
              <Plus className="h-4 w-4 text-brand-500" />
              Nuevo chat
            </button>

            <div className="mx-4 my-2 border-t border-[#E5E7EB]" />

            <div className="flex-1 overflow-auto px-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              ) : nonEmpty.length === 0 ? (
                <p className="py-8 text-center text-sm text-surface-100">Sin conversaciones aún</p>
              ) : (
                <div className="space-y-0.5">
                  {nonEmpty.map((session) => {
                    const active = session.id === currentSessionId;
                    return (
                      <button
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                          active ? 'bg-brand-500/10' : 'hover:bg-surface-900'
                        }`}
                      >
                        <MessageSquare className={`h-4 w-4 shrink-0 ${active ? 'text-brand-500' : 'text-surface-100'}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-medium ${active ? 'text-brand-500' : 'text-surface-50'}`}>
                            {getSessionTitle(session)}
                          </p>
                          <p className="text-xs text-surface-100">{formatDate(session.date)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mx-4 border-t border-[#E5E7EB]" />

            <div className="p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
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
