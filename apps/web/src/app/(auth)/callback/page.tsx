'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { getAuthVariants } from '@/lib/motion';

interface AuthApiResponse {
  accessToken: string;
  userId: string;
  email: string;
}

export default function CallbackPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [hasFailed, setHasFailed] = useState(false);
  const reducedMotion = useReducedMotion();
  const { container: containerVariants, item: itemVariants } = getAuthVariants(Boolean(reducedMotion));

  useEffect(() => {
    let isCancelled = false;

    const completeOAuthSignIn = async (): Promise<void> => {
      try {
        const res = await apiPost<AuthApiResponse>('/auth/refresh');
        if (!res) throw new Error('Sign-in failed');
        if (isCancelled) return;
        setAuth(res.accessToken, res.userId, res.email);
        router.push('/today');
      } catch (err) {
        console.error('OAuth sign-in failed:', err);
        if (!isCancelled) setHasFailed(true);
      }
    };

    void completeOAuthSignIn();

    return () => {
      isCancelled = true;
    };
  }, [router, setAuth]);

  if (hasFailed) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        role="status"
        aria-live="polite"
        className="flex flex-col items-center text-center"
      >
        <motion.div variants={itemVariants} className="mb-3">
          <p className="font-display text-3xl font-extrabold text-t1 mb-1">Sign-in failed</p>
          <p className="text-sm text-t2">Please try again.</p>
        </motion.div>
        <motion.div variants={itemVariants} className="mt-4">
          <Link href="/login" className="text-sm text-violet hover:opacity-80 transition-opacity">
            Back to sign in
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      role="status"
      aria-live="polite"
      className="flex flex-col items-center text-center"
    >
      <motion.div variants={itemVariants} className="mb-4">
        <Loader2 className="w-8 h-8 text-violet animate-spin" strokeWidth={1.8} aria-hidden="true" />
      </motion.div>
      <motion.div variants={itemVariants}>
        <p className="font-display text-2xl font-extrabold text-t1 mb-1">Signing you in...</p>
        <p className="text-sm text-t2">Just a moment</p>
      </motion.div>
    </motion.div>
  );
}
