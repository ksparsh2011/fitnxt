'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { LoginSchema, type LoginInput } from '@fitnxt/shared';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { apiPost } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { getAuthVariants } from '@/lib/motion';

interface AuthApiResponse {
  accessToken: string;
  userId: string;
  email: string;
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const { container: containerVariants, item: itemVariants } = getAuthVariants(Boolean(reducedMotion));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      const res = await apiPost<AuthApiResponse>('/auth/login', data);
      if (!res) throw new Error('Login failed');
      setAuth(res.accessToken, res.userId, res.email);
      router.push('/today');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-t2 hover:text-t1 transition-colors"
    >
      {showPassword ? (
        <EyeOff size={18} strokeWidth={1.8} />
      ) : (
        <Eye size={18} strokeWidth={1.8} />
      )}
    </button>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col"
    >
      {/* Back */}
      <motion.div variants={itemVariants}>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-t2 py-3 min-h-[44px]"
        >
          <ArrowLeft size={20} strokeWidth={1.8} />
          Back
        </button>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <motion.div variants={itemVariants} className="mb-3">
          <p className="font-display text-3xl font-extrabold text-t1 mb-1">Welcome back</p>
          <p className="text-sm text-t2">Sign in to your account</p>
        </motion.div>

        {serverError && (
          <motion.p
            variants={itemVariants}
            role="alert"
            className="text-sm text-danger mb-4 px-3 py-2 rounded-xl bg-danger-tint border border-danger"
          >
            {serverError}
          </motion.p>
        )}

        <motion.div variants={itemVariants} className="mt-6">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="mt-4">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            trailingIcon={passwordToggle}
            {...register('password')}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="text-right mt-2 mb-6">
          <Link href="/forgot-password" className="text-sm text-violet hover:opacity-80 transition-opacity">
            Forgot password?
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            className="w-full"
          >
            Sign in
          </Button>
        </motion.div>

        {/* Divider */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-t3">or</span>
          <div className="flex-1 h-px bg-border" />
        </motion.div>

        {/* Google OAuth button */}
        <motion.div variants={itemVariants}>
          <GoogleAuthButton />
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center text-sm text-t2 mt-8">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-violet hover:opacity-80 transition-opacity">
            Sign up
          </Link>
        </motion.div>
      </form>
    </motion.div>
  );
}
