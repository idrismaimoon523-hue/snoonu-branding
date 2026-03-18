'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate } from '@/lib/api';
import { setUser, roleHome } from '@/lib/auth';
import type { AuthUser } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [companyCode, setCompanyCode] = useState('');
  const [phone, setPhone]             = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authenticate(companyCode.trim(), phone.trim()) as {
        success: boolean; error?: string; user?: AuthUser;
      };
      if (!res.success || !res.user) {
        setError(res.error || 'Invalid credentials. Please try again.');
        return;
      }
      setUser(res.user);
      router.push(roleHome(res.user.role));
    } catch {
      setError('Connection error. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-950 flex-col justify-between p-12">

        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand opacity-10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-brand opacity-5 blur-[80px] pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-brand">
            <span className="text-white font-black text-xl tracking-tight">S</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">snoonu</span>
        </div>

        {/* Center content */}
        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-xs text-zinc-400 font-medium">Vehicle Branding Portal</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight">
            Manage your fleet<br />
            <span className="text-brand">branding</span> operations
          </h1>

          <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
            A unified platform for 3PL operators, admins, and suppliers to coordinate vehicle branding workflows end-to-end.
          </p>

          {/* Feature list */}
          <div className="space-y-3 pt-2">
            {[
              'Real-time schedule management',
              'Photo upload & admin verification',
              'Automated re-branding workflows',
            ].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-brand/15 flex items-center justify-center shrink-0">
                  <svg className="h-3 w-3 text-brand" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M10.28 2.28L4 8.56 1.72 6.28a1 1 0 00-1.44 1.44l3 3a1 1 0 001.44 0l7-7a1 1 0 00-1.44-1.44z" />
                  </svg>
                </div>
                <span className="text-sm text-zinc-400">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} Snoonu. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-zinc-50">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
              <span className="text-white font-black text-lg">S</span>
            </div>
            <span className="text-zinc-900 font-bold text-lg">snoonu</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Welcome back</h2>
            <p className="text-zinc-500 text-sm mt-1.5">
              Sign in with your company credentials
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <svg className="h-4 w-4 text-red-500 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V5zm.75 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Company Code"
              placeholder="e.g. 3PL001"
              value={companyCode}
              onChange={e => setCompanyCode(e.target.value)}
              required
              autoComplete="username"
              autoFocus
            />
            <Input
              label="Owner Phone Number"
              type="password"
              placeholder="••••••••"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full mt-2 h-10"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-200">
            <p className="text-xs text-center text-zinc-400">
              Need access?{' '}
              <span className="text-zinc-600 font-medium">
                Contact your Snoonu administrator
              </span>
            </p>
          </div>

          {/* Role hint */}
          <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-3.5 space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Test Accounts</p>
            <div className="space-y-1.5">
              {[
                { role: '3PL',      code: '3PL001',  phone: '55551111' },
                { role: 'Admin',    code: 'ADMIN01', phone: '55559999' },
                { role: 'Supplier', code: 'SUP001',  phone: '55552222' },
              ].map(r => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => { setCompanyCode(r.code); setPhone(r.phone); setError(''); }}
                  className="w-full flex items-center justify-between rounded-md px-3 py-2 text-xs hover:bg-zinc-50 transition-colors border border-zinc-100 group"
                >
                  <span className="font-medium text-zinc-700 group-hover:text-brand transition-colors">{r.role}</span>
                  <span className="text-zinc-400 font-mono">{r.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
