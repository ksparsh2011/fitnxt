'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { RegisterSchema, type RegisterInput } from '@fitnxt/shared';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiPost } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { authContainerVariants, authItemVariants } from '@/lib/motion';

interface AuthApiResponse {
  accessToken: string;
  userId: string;
  email: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      const res = await apiPost<AuthApiResponse>('/auth/register', {
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      });
      if (!res) throw new Error('Registration failed');
      setAuth(res.accessToken, res.userId, res.email);
      router.push('/onboard');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed');
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

  const confirmToggle = (
    <button
      type="button"
      onClick={() => setShowConfirm((v) => !v)}
      aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-t2 hover:text-t1 transition-colors"
    >
      {showConfirm ? (
        <EyeOff size={18} strokeWidth={1.8} />
      ) : (
        <Eye size={18} strokeWidth={1.8} />
      )}
    </button>
  );

  return (
    <motion.div
      variants={authContainerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col"
    >
      {/* Logo */}
      <motion.div variants={authItemVariants} className="text-center mb-10">
        <div className="font-display text-5xl font-extrabold tracking-tight leading-none mb-3">
          <span className="text-t1">fit</span>
          <span className="text-violet">NXT</span>
        </div>
        <p className="text-sm text-t2">AI-powered performance intelligence</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <motion.div variants={authItemVariants} className="mb-3">
          <p className="font-display text-3xl font-extrabold text-t1 mb-1">Create account</p>
          <p className="text-sm text-t2">Start your AI-powered fitness journey</p>
        </motion.div>

        {serverError && (
          <motion.p
            variants={authItemVariants}
            role="alert"
            className="text-sm text-danger mb-4 px-3 py-2 rounded-xl bg-danger-tint border border-danger"
          >
            {serverError}
          </motion.p>
        )}

        <motion.div variants={authItemVariants} className="mt-6">
          <Input
            label="Display name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            error={errors.displayName?.message}
            {...register('displayName')}
          />
        </motion.div>

        <motion.div variants={authItemVariants} className="mt-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </motion.div>

        <motion.div variants={authItemVariants} className="mt-4">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            error={errors.password?.message}
            trailingIcon={passwordToggle}
            {...register('password')}
          />
        </motion.div>

        <motion.div variants={authItemVariants} className="mt-4">
          <Input
            label="Confirm password"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repeat your password"
            error={errors.confirmPassword?.message}
            trailingIcon={confirmToggle}
            {...register('confirmPassword')}
          />
        </motion.div>

        <motion.div variants={authItemVariants} className="mt-6">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            className="w-full"
          >
            Create account
          </Button>
        </motion.div>

        {/* Divider */}
        <motion.div variants={authItemVariants} className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-t3">or</span>
          <div className="flex-1 h-px bg-border" />
        </motion.div>

        {/* Google OAuth button */}
        <motion.div variants={authItemVariants}>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="w-full h-[52px] bg-surface-2 border border-border-2 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-medium text-t1 opacity-40 cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
            <span className="text-xs text-t3 font-normal">(Coming soon)</span>
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div variants={authItemVariants} className="text-center text-sm text-t2 mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-violet hover:opacity-80 transition-opacity">
            Sign in
          </Link>
        </motion.div>
      </form>
    </motion.div>
  );
}
