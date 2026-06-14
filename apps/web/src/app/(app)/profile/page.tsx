'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LogOut, RefreshCw } from 'lucide-react';

import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileData {
  displayName: string;
  fitnessGoal: string;
  activityLevel: string;
  totalSessions: number;
  memberSince: string;
}

interface PatchProfileBody {
  displayName?: string;
  fitnessGoal?: string;
  activityLevel?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GOAL_OPTIONS: { label: string; value: string }[] = [
  { label: 'Lean Bulk',   value: 'lean_bulk'  },
  { label: 'Cut',         value: 'cut'        },
  { label: 'Body Recomp', value: 'recomp'     },
  { label: 'Strength',    value: 'strength'   },
  { label: 'Endurance',   value: 'endurance'  },
];

const ACTIVITY_OPTIONS: { label: string; value: string }[] = [
  { label: 'Sedentary', value: 'sedentary'         },
  { label: 'Light',     value: 'lightly_active'    },
  { label: 'Moderate',  value: 'moderately_active' },
  { label: 'Active',    value: 'very_active'       },
  { label: 'Athlete',   value: 'extremely_active'  },
];

const pageVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] as const },
  },
} as const;

// ─── ChipGrid ────────────────────────────────────────────────────────────────

interface ChipGridProps {
  options: { label: string; value: string }[];
  selected: string | null;
  onSelect: (value: string) => void;
}

function ChipGrid({ options, selected, onSelect }: ChipGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const isActive = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            aria-pressed={isActive}
            className={cn(
              'rounded-full px-4 py-2 text-sm text-center transition-colors duration-150',
              isActive
                ? 'bg-violet-tint border border-violet-border text-violet font-medium'
                : 'bg-surface-2 border border-border text-t2',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── SectionLabel ────────────────────────────────────────────────────────────

function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="text-xs uppercase tracking-widest text-t3 mb-3">
      {children}
    </p>
  );
}

// ─── ProfileSkeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="px-5 pt-12 pb-24 space-y-8 max-w-[390px] mx-auto">
      <div className="h-7 w-24 rounded-full bg-surface-3 animate-skeleton" />
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-surface-3 animate-skeleton" />
        <div className="h-5 w-32 rounded-full bg-surface-3 animate-skeleton" />
        <div className="h-4 w-28 rounded-full bg-surface-3 animate-skeleton" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-16 rounded-full bg-surface-3 animate-skeleton" />
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-9 rounded-full bg-surface-3 animate-skeleton" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-surface-3 animate-skeleton" />
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-9 rounded-full bg-surface-3 animate-skeleton" />
          ))}
        </div>
      </div>
      <div className="h-20 rounded-2xl bg-surface-3 animate-skeleton" />
    </div>
  );
}

// ─── ProfilePage ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const { toast }   = useToast();
  const clearAuth   = useAuthStore((s) => s.clearAuth);

  // null = no pending local change; server value is authoritative
  const [localGoal,     setLocalGoal]     = useState<string | null>(null);
  const [localActivity, setLocalActivity] = useState<string | null>(null);

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['profile'],
    queryFn:  () => apiGet<ProfileData>('/users/me/profile'),
  });

  // Reset local overrides whenever server data refreshes (e.g. after a save)
  useEffect(() => {
    if (profile) {
      setLocalGoal(null);
      setLocalActivity(null);
    }
  }, [profile]);

  const { mutate: saveProfile, isPending: isSaving } = useMutation({
    mutationFn: (body: PatchProfileBody) =>
      apiPatch<ProfileData>('/users/me/profile', body),
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData<ProfileData>(['profile'], data);
      }
      toast('Profile saved', 'success');
    },
    onError: () => {
      toast('Failed to save', 'error');
    },
  });

  const effectiveGoal     = localGoal     ?? profile?.fitnessGoal  ?? null;
  const effectiveActivity = localActivity ?? profile?.activityLevel ?? null;

  const hasChanges =
    (localGoal     !== null && localGoal     !== profile?.fitnessGoal)  ||
    (localActivity !== null && localActivity !== profile?.activityLevel);

  function handleGoalSelect(val: string) {
    // Tapping the already-selected chip reverts to server value
    setLocalGoal(val === profile?.fitnessGoal ? null : val);
  }

  function handleActivitySelect(val: string) {
    setLocalActivity(val === profile?.activityLevel ? null : val);
  }

  function handleSave() {
    const body: PatchProfileBody = {};
    if (localGoal     !== null) body.fitnessGoal   = localGoal;
    if (localActivity !== null) body.activityLevel = localActivity;
    saveProfile(body);
  }

  async function handleLogout() {
    try {
      await apiPost('/auth/logout');
    } catch {
      // Network failure — still clear local auth and redirect
    } finally {
      clearAuth();
      router.replace('/login');
    }
  }

  // ── Loading ──
  if (isLoading) return <ProfileSkeleton />;

  // ── Error ──
  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-dvh px-5">
        <p className="text-danger text-sm text-center">Failed to load profile</p>
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          <RefreshCw className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          Retry
        </Button>
      </div>
    );
  }

  // ── Derived display values ──
  const avatarLetter = profile.displayName.charAt(0).toUpperCase();
  const memberSince  = new Date(profile.memberSince).toLocaleDateString('en-US', {
    month: 'long',
    year:  'numeric',
  });

  // ── Render ──
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="overflow-y-auto"
    >
      <div className="px-5 pt-12 pb-24 space-y-8 max-w-[390px] mx-auto">

        {/* Header */}
        <h1 className="font-display font-bold text-2xl text-t1">Profile</h1>

        {/* Avatar + identity */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-deep to-violet flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="font-display font-bold text-3xl text-white">
              {avatarLetter}
            </span>
          </div>
          <p className="font-display font-bold text-xl text-t1 mt-1">
            {profile.displayName}
          </p>
          <p className="text-sm text-t2">Member since {memberSince}</p>
        </div>

        {/* Goal chips */}
        <section aria-labelledby="section-goal">
          <SectionLabel id="section-goal">My Goal</SectionLabel>
          <ChipGrid
            options={GOAL_OPTIONS}
            selected={effectiveGoal}
            onSelect={handleGoalSelect}
          />
        </section>

        {/* Activity level chips */}
        <section aria-labelledby="section-activity">
          <SectionLabel id="section-activity">Activity Level</SectionLabel>
          <ChipGrid
            options={ACTIVITY_OPTIONS}
            selected={effectiveActivity}
            onSelect={handleActivitySelect}
          />
        </section>

        {/* Stats */}
        <div className="bg-surface-2 border border-border rounded-2xl p-4">
          <p className="text-xs text-t2 mb-1">Sessions Completed</p>
          <p className="font-mono text-2xl font-medium text-t1">
            {profile.totalSessions}
          </p>
        </div>

        {/* Save button — only visible when there are pending changes */}
        {hasChanges && (
          <Button
            variant="primary"
            size="lg"
            loading={isSaving}
            onClick={handleSave}
            className="w-full rounded-2xl font-display font-bold text-lg"
          >
            Save Changes
          </Button>
        )}

        {/* Logout */}
        <Button
          variant="danger"
          size="md"
          onClick={() => void handleLogout()}
          className="w-full rounded-2xl text-sm font-medium"
          aria-label="Log out of fitNXT"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          Log Out
        </Button>

      </div>
    </motion.div>
  );
}
