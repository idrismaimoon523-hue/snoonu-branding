'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getUser, clearUser } from '@/lib/auth';
import type { AuthUser } from '@/types';
import clsx from 'clsx';

const NAV: Record<string, { href: string; label: string; icon: React.ReactNode }[]> = {
  '3PL': [
    { href: '/3pl/request',         label: 'Request',             icon: <IconClipboard /> },
    { href: '/3pl/schedule',        label: 'Schedule',            icon: <IconCalendar /> },
    { href: '/3pl/branded',         label: 'Branded Vehicles',    icon: <IconCar /> },
    { href: '/3pl/sticker-removed', label: 'Sticker Removed',     icon: <IconTrash /> },
    { href: '/3pl/replacement',     label: 'Replacement Request', icon: <IconRefresh /> },
  ],
  Admin: [
    { href: '/admin/schedule',           label: 'Schedule',           icon: <IconCalendar /> },
    { href: '/admin/verification',       label: 'Verification',       icon: <IconClipboard /> },
    { href: '/admin/driver-replacement', label: 'Driver Replacement', icon: <IconRefresh /> },
    { href: '/admin/branded',            label: 'Branded Vehicles',   icon: <IconCar /> },
    { href: '/admin/sticker-removed',    label: 'Sticker Removed',    icon: <IconTrash /> },
    { href: '/admin/slots',              label: 'Supplier Slots',     icon: <IconGrid /> },
  ],
  Supplier: [
    { href: '/supplier/schedule',        label: 'Assigned Jobs',    icon: <IconCalendar /> },
    { href: '/supplier/sticker-removed', label: 'Sticker Removed',  icon: <IconTrash /> },
    { href: '/supplier/branded',         label: 'Branded Vehicles', icon: <IconCar /> },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  '3PL':      'bg-blue-500',
  Admin:      'bg-brand',
  Supplier:   'bg-emerald-500',
};

const ROLE_LABELS: Record<string, string> = {
  '3PL': '3PL Operator',
  Admin: 'Administrator',
  Supplier: 'Supplier',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    setUser(u);
  }, [router]);

  function logout() { clearUser(); router.replace('/login'); }

  if (!user) return null;

  const navLinks = NAV[user.role] ?? [];
  const initials = user.companyName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar-bg transition-transform duration-200 ease-in-out',
          'lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-brand shrink-0">
            <span className="text-white font-black text-base tracking-tight">S</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">snoonu</p>
            <p className="text-zinc-500 text-[10px] mt-0.5 font-medium">BRANDING PORTAL</p>
          </div>
        </div>

        {/* User chip */}
        <div className="mx-3 mb-4 rounded-xl bg-sidebar-active border border-sidebar-border p-3">
          <div className="flex items-center gap-2.5">
            <div className={clsx('h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', ROLE_COLORS[user.role])}>
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium leading-none truncate">{user.companyName}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
        </div>

        {/* Nav section label */}
        <div className="px-4 mb-2">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Navigation</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {navLinks.map(link => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-brand text-white shadow-sm shadow-brand/30'
                    : 'text-zinc-400 hover:text-white hover:bg-sidebar-hover',
                )}
              >
                <span className={clsx('shrink-0 transition-colors', active ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300')}>
                  {link.icon}
                </span>
                <span className="truncate">{link.label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 hover:text-white hover:bg-sidebar-hover transition-all duration-150"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between bg-white border-b border-zinc-200 px-4 lg:px-6 h-14 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Hamburger */}
            <button
              className="lg:hidden p-2 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-zinc-400 font-medium hidden sm:inline">{ROLE_LABELS[user.role]}</span>
              <span className="text-zinc-300 hidden sm:inline">/</span>
              <span className="font-semibold text-zinc-800">
                {navLinks.find(l => pathname.startsWith(l.href))?.label ?? 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-500">
              <span className={clsx('h-2 w-2 rounded-full', ROLE_COLORS[user.role])} />
              <span>{user.companyCode}</span>
            </div>
            <div className={clsx('h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold', ROLE_COLORS[user.role])}>
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Icon components ────────────────────────────────────────────
function IconClipboard() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function IconCar() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1M13 16l2 1M13 16H3m10 0h5v-5l-2-5H3" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function IconRefresh() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}
