'use client';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { ResetPasswordSchema, type ResetPasswordInput } from '@fitnxt/shared';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiPost } from '@/lib/api';
import { getAuthVariants } from '@/lib/motion';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const { container: containerVariants, item: itemVariants } = getAuthVariants(Boolean(reducedMotion));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) return;
    setServerError(null);
    try {
      await apiPost('/auth/reset-password', { token, newPassword: data.newPassword });
      router.push('/login');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Unable to reset password');
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

  if (!token) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col"
      >
        <motion.div variants={itemVariants} className="mb-3">
          <p className="font-display text-3xl font-extrabold text-t1 mb-1">Invalid link</p>
          <p className="text-sm text-t2">Invalid or missing reset link</p>
        </motion.div>
        <motion.div variants={itemVariants} className="mt-4">
          <Link href="/forgot-password" className="text-sm text-violet hover:opacity-80 transition-opacity">
            Request a new reset link
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
      className="flex flex-col"
    >
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

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <motion.div variants={itemVariants} className="mb-3">
          <p className="font-display text-3xl font-extrabold text-t1 mb-1">Reset password</p>
          <p className="text-sm text-t2">Choose a new password for your account</p>
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
            label="New password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            error={errors.newPassword?.message}
            trailingIcon={passwordToggle}
            {...register('newPassword')}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="mt-4">
          <Input
            label="Confirm new password"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repeat your password"
            error={errors.confirmPassword?.message}
            trailingIcon={confirmToggle}
            {...register('confirmPassword')}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="mt-6">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            className="w-full"
          >
            Reset password
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
