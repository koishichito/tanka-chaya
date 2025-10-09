import { ReactNode, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = useMemo(() => {
    const items: Array<{ label: string; to: string; adminOnly?: boolean }> = [
      { label: 'イベント履歴', to: '/events/history' },
      { label: 'マイ投稿', to: '/my/submissions' }
    ];

    if (user?.isAdmin) {
      items.push({ label: '管理画面', to: '/admin', adminOnly: true });
    }

    return items;
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-6">
            <Link
              to="/"
              className="group flex items-center gap-3 text-lg font-semibold tracking-wide text-white transition hover:text-purple-200"
              aria-label="ホームに戻る"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl font-extrabold leading-none text-purple-200 transition group-hover:bg-white/20">
                和
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-base">短歌茶屋</span>
                <span className="text-xs text-white/70">Tanka Chaya</span>
              </div>
            </Link>
            {user && (
              <div className="hidden text-sm font-medium text-white/80 md:block">
                ようこそ、{user.displayName} さん
              </div>
            )}
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              if (item.adminOnly && !user?.isAdmin) return null;
              const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-white text-purple-700 shadow-lg'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">{children}</div>
      </main>
    </div>
  );
}
