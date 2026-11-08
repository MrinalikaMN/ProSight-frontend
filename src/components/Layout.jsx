import { useEffect, useState } from 'react';
import { useTheme } from '../lib/theme';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { IconDashboard, IconBoard, IconTeam, IconAlert, IconSun, IconMoon, IconLogout, IconMenu, IconX, IconMail } from './icons';
import { cx } from '../lib/cx';
import { useAlerts } from '../lib/alerts';
import AlertsBell from './AlertsBell';

const NAV = [
  { to: '/', label: 'Overview', icon: IconDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: IconBoard },
  { to: '/warnings', label: 'Warnings', icon: IconAlert },
  { to: '/team', label: 'Team', icon: IconTeam },
];

export function Logo({ className }) {
  return (
    <span className={cx('flex items-center gap-2.5', className)}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--brand)" />
        <rect x="7" y="17" width="4" height="8" rx="1.5" fill="#fff" opacity=".55" />
        <rect x="14" y="12" width="4" height="13" rx="1.5" fill="#fff" opacity=".8" />
        <rect x="21" y="7" width="4" height="18" rx="1.5" fill="#FFB547" />
      </svg>
      <span className="text-[17px] font-extrabold tracking-[-0.02em] text-ink">ProSight</span>
    </span>
  );
}

function SidebarContent({ onNavigate, onLogout, dark, setDark, alerts }) {
  const username = localStorage.getItem('username') || 'User';
  const role = (localStorage.getItem('userRole') || 'MEMBER').replace(/^ROLE_/, '');
  return (
    <div className="flex h-full flex-col">
      <div className="pl-5 pr-3 h-16 flex items-center justify-between">
        <Logo />
        {alerts && <AlertsBell alerts={alerts} />}
      </div>
      <nav className="flex-1 px-3 py-2 space-y-0.5" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to} to={to} end={end} onClick={onNavigate}
            className={({ isActive }) => cx(
              'flex items-center gap-3 rounded-lg px-3 h-10 text-sm font-semibold transition-colors',
              isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink hover:bg-surface-2'
            )}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-line space-y-1">
        <NavLink
          to="/settings" onClick={onNavigate}
          className={({ isActive }) => cx(
            'w-full flex items-center gap-3 rounded-lg px-3 h-10 text-sm font-semibold transition-colors',
            isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:text-ink hover:bg-surface-2'
          )}
        >
          <IconMail />
          Notifications
        </NavLink>
        <button
          onClick={() => setDark(!dark)}
          className="w-full flex items-center gap-3 rounded-lg px-3 h-10 text-sm font-semibold text-muted hover:text-ink hover:bg-surface-2 cursor-pointer"
        >
          {dark ? <IconSun /> : <IconMoon />}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="h-8 w-8 shrink-0 rounded-full bg-brand-soft text-brand flex items-center justify-center text-sm font-bold">
            {username.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink truncate">{username}</span>
            <span className="block text-xs text-muted capitalize">{role.toLowerCase()}</span>
          </span>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-muted hover:text-risk hover:bg-risk-soft cursor-pointer"
            aria-label="Sign out" title="Sign out"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ onLogout }) {
  const [dark, setDark] = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const alerts = useAlerts();
  const location = useLocation();

  useEffect(() => {
    const current = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));
    const label = current?.label ?? (location.pathname.startsWith('/settings') ? 'Notifications' : null);
    document.title = label ? `${label} | ProSight` : 'ProSight';
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 bg-surface border-r border-line z-30">
        <SidebarContent onLogout={onLogout} dark={dark} setDark={setDark} alerts={alerts} />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 h-14 bg-surface/90 backdrop-blur border-b border-line flex items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-1">
        <AlertsBell alerts={alerts} align="right" />
        <button onClick={() => setMenuOpen(true)} className="p-2 -mr-2 rounded-lg text-ink hover:bg-surface-2 cursor-pointer" aria-label="Open menu">
          <IconMenu size={20} />
        </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-[#070a12]/60 animate-fade" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface border-r border-line animate-pop">
            <button onClick={() => setMenuOpen(false)} className="absolute right-3 top-4 p-2 rounded-lg text-muted hover:bg-surface-2 cursor-pointer" aria-label="Close menu">
              <IconX />
            </button>
            <SidebarContent onNavigate={() => setMenuOpen(false)} onLogout={onLogout} dark={dark} setDark={setDark} />
          </aside>
        </div>
      )}

      <main className="lg:pl-60">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
