'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, roleHome } from '@/lib/auth';

export default function DashboardRoot() {
  const router = useRouter();
  useEffect(() => {
    const user = getUser();
    if (user) router.replace(roleHome(user.role));
    else router.replace('/login');
  }, [router]);
  return null;
}
