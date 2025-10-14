'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthStatus } from '@/services/auth';
import { useToast } from '@/components/ToastProvider';

export default function MyPage() {
  const router = useRouter();
  const toast = useToast();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAuth = async () => {
      const user = await fetchAuthStatus();
      const userRole = user ? user.role : undefined;

      if (userRole === 'USER') {
        router.push('/user-dashboard');
      } else if (userRole === 'ARTIST') {
        router.push('/artist/main');
      } else {
        toast.error('로그인이 필요한 서비스입니다');
        router.push('/');
      }
    };

    checkAuth();
  }, [router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>페이지 이동 중...</p>
    </div>
  );
}
