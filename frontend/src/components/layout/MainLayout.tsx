import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants/navigation';

export const MainLayout = () => {
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) return;

    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => document.documentElement.style.setProperty('--app-height', `${vv.height}px`);
    update();
    vv.addEventListener('resize', update);
    return () => vv.removeEventListener('resize', update);
  }, []);

  return (
    <div
      className="relative flex flex-col bg-paper text-ink lg:flex-row"
      style={{ height: 'var(--app-height, 100dvh)' }}
    >
      {/* Barra lateral: solo escritorio */}
      <aside className="hidden w-56 flex-none flex-col border-r border-line px-3 pb-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] lg:flex">
        <div className="mb-8 flex items-center gap-2.5 px-3">
          <img src="/fitnesschat-logo.png" alt="" className="h-7 w-7" />
          <span className="font-num text-xl font-extrabold uppercase tracking-[.01em]">FitnessChat</span>
        </div>
        <nav aria-label="Secciones" className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-full px-3 py-2 text-[15px] font-semibold transition-colors ${
                  isActive ? 'bg-volt text-ink' : 'text-muted hover:bg-line-2 hover:text-ink'
                }`
              }
            >
              <Icon className="h-[22px] w-[22px]" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto pt-[env(safe-area-inset-top)] lg:pt-0">
        <Outlet />
      </main>

      {/* Barra de pestañas: celular y tablet */}
      <nav
        aria-label="Secciones"
        className="grid flex-none grid-cols-4 border-t border-line bg-paper px-1.5 pt-1.5 pb-[max(env(safe-area-inset-bottom),16px)] lg:hidden"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-[3px] py-1 text-[11.5px] font-semibold ${isActive ? 'text-ink' : 'text-muted'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`inline-flex rounded-full px-3.5 py-0.5 ${isActive ? 'bg-volt' : ''}`}>
                  <Icon className="h-[22px] w-[22px]" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

    </div>
  );
};
