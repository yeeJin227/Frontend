'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { useAuthStore } from '@/stores/authStore';

export default function MyPage() {
  const router = useRouter();
  const toast = useToast();
  const hasChecked = useRef(false);
  const role = useAuthStore((store) => store.role);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAuth = async () => {
      if (role === 'USER') {
        router.push('/user-dashboard');
      } else if (role === 'ARTIST') {
        router.push('/artist/main');
      } else {
        toast.error('로그인이 필요한 서비스입니다');
        router.push('/');
      }
    };

    checkAuth();
  }, [role, router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>페이지 이동 중...</p>
    </div>
  );
}
