import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import api from '../services/api';
import type { ChatSession } from '../types';

export const SessionsPage = () => {
  const navigate = useNavigate();
  const { sessions, setSessions, currentSessionId, loadSessionMessages } = useAppStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/chat/sessions/');
      setSessions(data);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleSelect = async (session: ChatSession) => {
    await loadSessionMessages(session.id);
    navigate('/');
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

  const getTitle = (session: ChatSession) => {
    const msg = session.messages?.[0]?.content;
    if (msg) return msg.length > 40 ? msg.slice(0, 40) + '...' : msg;
    return `Sesión ${session.id}`;
  };

  const nonEmpty = sessions.filter(s => s.messages && s.messages.length > 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-surface-50">Historial de sesiones</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : nonEmpty.length === 0 ? (
        <p className="py-12 text-center text-sm text-surface-100">Sin conversaciones aún</p>
      ) : (
        <div className="space-y-1">
          {nonEmpty.map((session) => {
            const active = session.id === currentSessionId;
            return (
              <button
                key={session.id}
                onClick={() => handleSelect(session)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  active ? 'bg-brand-500/10' : 'hover:bg-surface-900'
                }`}
              >
                <div className={`rounded-lg p-2 ${active ? 'bg-brand-500/10' : 'bg-surface-900'}`}>
                  <MessageSquare className={`h-4 w-4 ${active ? 'text-brand-500' : 'text-surface-100'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${active ? 'text-brand-500' : 'text-surface-50'}`}>
                    {getTitle(session)}
                  </p>
                  <p className="text-xs text-surface-100">{formatDate(session.date)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
