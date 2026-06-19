'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@fitnxt/shared';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiPost } from '@/lib/api';
import { getAuthVariants } from '@/lib/motion';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const reducedMotion = useReducedMotion();
  const { container: containerVariants, item: itemVariants } = getAuthVariants(Boolean(reducedMotion));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null);
    try {
      await apiPost('/auth/forgot-password', data);
      // Always show the generic success message — backend never reveals if the email exists.
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

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

      <motion.div variants={itemVariants} className="mb-3">
        <p className="font-display text-3xl font-extrabold text-t1 mb-1">Forgot password?</p>
        <p className="text-sm text-t2">Enter your email and we&apos;ll send you a reset link</p>
      </motion.div>

      {submitted ? (
        <motion.div
          variants={itemVariants}
          className="flex items-start gap-2.5 mt-6 px-3 py-3 rounded-2xl bg-surface-2 border border-border-2"
        >
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" strokeWidth={1.8} aria-hidden="true" />
          <p className="text-sm text-t1">
            If an account with that email exists, we&apos;ve sent a password reset link.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
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

          <motion.div variants={itemVariants} className="mt-6">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full"
            >
              Send reset link
            </Button>
          </motion.div>
        </form>
      )}

      <motion.div variants={itemVariants} className="text-center text-sm text-t2 mt-8">
        Remembered your password?{' '}
        <Link href="/login" className="text-violet hover:opacity-80 transition-opacity">
          Sign in
        </Link>
      </motion.div>
    </motion.div>
  );
}
