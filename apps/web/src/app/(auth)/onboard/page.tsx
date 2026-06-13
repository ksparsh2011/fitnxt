'use client';
import { useReducer, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  TrendingUp,
  Flame,
  RefreshCw,
  Dumbbell,
  Wind,
  Armchair,
  Footprints,
  PersonStanding,
  Bike,
  Zap,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiGet, apiPatch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// --------------- Types ---------------

interface UserProfileResponse {
  onboardingCompleted: boolean;
}

type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';

type FitnessGoal = 'lean_bulk' | 'cut' | 'recomp' | 'strength' | 'endurance';

type OnboardState = {
  slide: 0 | 1 | 2;
  fitness_goal: FitnessGoal | null;
  activity_level: ActivityLevel | null;
  target_weight_kg: string;
  unit: 'kg' | 'lbs';
  submitting: boolean;
  error: string | null;
};

type OnboardAction =
  | { type: 'SET_GOAL'; goal: FitnessGoal }
  | { type: 'SET_ACTIVITY'; level: ActivityLevel }
  | { type: 'SET_WEIGHT'; value: string }
  | { type: 'TOGGLE_UNIT' }
  | { type: 'NEXT_SLIDE' }
  | { type: 'PREV_SLIDE' }
  | { type: 'SET_SUBMITTING'; value: boolean }
  | { type: 'SET_ERROR'; message: string | null };

// --------------- Reducer ---------------

const initialState: OnboardState = {
  slide: 0,
  fitness_goal: null,
  activity_level: null,
  target_weight_kg: '',
  unit: 'kg',
  submitting: false,
  error: null,
};

function reducer(state: OnboardState, action: OnboardAction): OnboardState {
  switch (action.type) {
    case 'SET_GOAL':
      return { ...state, fitness_goal: action.goal };
    case 'SET_ACTIVITY':
      return { ...state, activity_level: action.level };
    case 'SET_WEIGHT':
      return { ...state, target_weight_kg: action.value };
    case 'TOGGLE_UNIT': {
      const currentVal = parseFloat(state.target_weight_kg);
      const newUnit = state.unit === 'kg' ? 'lbs' : 'kg';
      let newVal = '';
      if (!isNaN(currentVal) && currentVal > 0) {
        const converted =
          state.unit === 'kg'
            ? currentVal * 2.20462
            : currentVal / 2.20462;
        newVal = converted.toFixed(1);
      }
      return { ...state, unit: newUnit, target_weight_kg: newVal };
    }
    case 'NEXT_SLIDE':
      return { ...state, slide: (Math.min(state.slide + 1, 2)) as 0 | 1 | 2 };
    case 'PREV_SLIDE':
      return { ...state, slide: (Math.max(state.slide - 1, 0)) as 0 | 1 | 2 };
    case 'SET_SUBMITTING':
      return { ...state, submitting: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.message, submitting: false };
    default:
      return state;
  }
}

// --------------- Slide data ---------------

const GOALS: { value: FitnessGoal; label: string; description: string; icon: React.ReactNode }[] =
  [
    {
      value: 'lean_bulk',
      label: 'Lean Bulk',
      description: 'Build muscle while staying lean',
      icon: <TrendingUp size={20} strokeWidth={1.8} />,
    },
    {
      value: 'cut',
      label: 'Cut',
      description: 'Lose fat while preserving muscle',
      icon: <Flame size={20} strokeWidth={1.8} />,
    },
    {
      value: 'recomp',
      label: 'Body Recomp',
      description: 'Build muscle and lose fat simultaneously',
      icon: <RefreshCw size={20} strokeWidth={1.8} />,
    },
    {
      value: 'strength',
      label: 'Strength',
      description: 'Maximize your 1RM and raw power',
      icon: <Dumbbell size={20} strokeWidth={1.8} />,
    },
    {
      value: 'endurance',
      label: 'Endurance',
      description: 'Improve stamina and cardiovascular fitness',
      icon: <Wind size={20} strokeWidth={1.8} />,
    },
  ];

const ACTIVITY_LEVELS: {
  value: ActivityLevel;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'sedentary',
    label: 'Sedentary',
    icon: <Armchair size={20} strokeWidth={1.8} />,
  },
  {
    value: 'lightly_active',
    label: 'Lightly Active',
    icon: <Footprints size={20} strokeWidth={1.8} />,
  },
  {
    value: 'moderately_active',
    label: 'Moderately Active',
    icon: <PersonStanding size={20} strokeWidth={1.8} />,
  },
  {
    value: 'very_active',
    label: 'Very Active',
    icon: <Bike size={20} strokeWidth={1.8} />,
  },
  {
    value: 'extremely_active',
    label: 'Athlete',
    icon: <Zap size={20} strokeWidth={1.8} />,
  },
];

// --------------- Framer Motion variants ---------------

const slideVariants = {
  enter: { x: '100%', opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
} as const;


// --------------- Sub-components ---------------

interface GoalSlideProps {
  selected: FitnessGoal | null;
  onSelect: (goal: FitnessGoal) => void;
}

function GoalSlide({ selected, onSelect }: GoalSlideProps) {
  const reducedMotion = useReducedMotion();
  return (
    <div className="flex flex-col gap-3">
      <div className="mb-2">
        <p className="font-display text-2xl font-extrabold text-t1 mb-1">What&apos;s your goal?</p>
        <p className="text-base text-t2">We&apos;ll personalise your training and nutrition plan.</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {GOALS.map((goal) => {
          const isSelected = selected === goal.value;
          return (
            <motion.button
              key={goal.value}
              type="button"
              whileTap={reducedMotion ? undefined : { scale: 0.97 }}
              transition={{ duration: 0.1 }}
              onClick={() => onSelect(goal.value)}
              aria-pressed={isSelected}
              aria-label={goal.label}
              className={cn(
                'flex flex-col items-start gap-2 w-full p-4 rounded-2xl border text-left min-h-[110px]',
                isSelected
                  ? 'border-violet-border bg-violet-tint'
                  : 'bg-white/5 border-white/10',
              )}
            >
              <span className={cn('flex-shrink-0', isSelected ? 'text-violet' : 'text-t2')}>
                {goal.icon}
              </span>
              <span className="flex flex-col gap-0.5">
                <span
                  className={cn(
                    'text-base font-semibold leading-tight',
                    isSelected ? 'text-violet' : 'text-t1',
                  )}
                >
                  {goal.label}
                </span>
                <span className="text-xs text-t2 leading-snug">{goal.description}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

interface ActivitySlideProps {
  selected: ActivityLevel | null;
  onSelect: (level: ActivityLevel) => void;
}

function ActivitySlide({ selected, onSelect }: ActivitySlideProps) {
  const reducedMotion = useReducedMotion();
  return (
    <div className="flex flex-col gap-3">
      <div className="mb-2">
        <p className="font-display text-2xl font-extrabold text-t1 mb-1">Activity level</p>
        <p className="text-base text-t2">How active are you on a typical week?</p>
      </div>
      {ACTIVITY_LEVELS.map((level) => {
        const isSelected = selected === level.value;
        return (
          <motion.button
            key={level.value}
            type="button"
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
            transition={{ duration: 0.1 }}
            onClick={() => onSelect(level.value)}
            aria-pressed={isSelected}
            aria-label={level.label}
            className={cn(
              'flex items-center gap-4 w-full px-4 py-4 rounded-2xl border text-left',
              isSelected
                ? 'border-violet-border bg-violet-tint'
                : 'bg-white/5 border-white/10 hover:bg-white/10',
            )}
          >
            <span
              className={cn(
                'flex-shrink-0',
                isSelected ? 'text-violet' : 'text-t2',
              )}
            >
              {level.icon}
            </span>
            <span
              className={cn(
                'text-base font-semibold',
                isSelected ? 'text-violet' : 'text-t1',
              )}
            >
              {level.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

interface WeightSlideProps {
  weight: string;
  unit: 'kg' | 'lbs';
  onWeightChange: (value: string) => void;
  onToggleUnit: () => void;
}

function WeightSlide({ weight, unit, onWeightChange, onToggleUnit }: WeightSlideProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-display text-2xl font-extrabold text-t1 mb-1">Target weight</p>
        <p className="text-base text-t2">
          Optional — helps us calculate your calorie and macro targets.
        </p>
      </div>

      {/* Unit toggle pill */}
      <div className="flex items-center self-start gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
        {(['kg', 'lbs'] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => { if (u !== unit) onToggleUnit(); }}
            aria-pressed={unit === u}
            aria-label={`Switch to ${u}`}
            className={cn(
              'min-w-[44px] min-h-[44px] px-4 rounded-lg text-sm font-semibold',
              unit === u
                ? 'bg-violet-deep text-white'
                : 'text-t2 hover:text-t1',
            )}
          >
            {u}
          </button>
        ))}
      </div>

      <Input
        type="number"
        inputMode="decimal"
        min="20"
        max="500"
        step="0.1"
        value={weight}
        onChange={(e) => onWeightChange(e.target.value)}
        placeholder={unit === 'kg' ? '70.0' : '154.0'}
        aria-label={`Target weight in ${unit}`}
        trailingIcon={
          <span className="text-sm font-semibold text-t2 pointer-events-none px-2">{unit}</span>
        }
      />
    </div>
  );
}

// --------------- Main component ---------------

export default function OnboardPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [state, dispatch] = useReducer(reducer, initialState);
  const reducedMotion = useReducedMotion();

  // Redirect guard — if no token redirect to login; if already onboarded, skip to today
  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    apiGet<UserProfileResponse>('/users/me')
      .then((res) => {
        if (res.onboardingCompleted) {
          router.replace('/today');
        }
      })
      .catch(() => {
        // If the profile fetch fails, let the user continue onboarding
      });
  }, [accessToken, router]);

  const canContinue =
    state.slide === 0
      ? state.fitness_goal !== null
      : state.slide === 1
        ? state.activity_level !== null
        : true; // weight slide is always skippable

  const handleSubmit = async (skipWeight: boolean) => {
    if (!accessToken || !state.fitness_goal || !state.activity_level) return;
    dispatch({ type: 'SET_SUBMITTING', value: true });

    let targetWeightKg: number | null = null;
    if (!skipWeight && state.target_weight_kg !== '') {
      const parsed = parseFloat(state.target_weight_kg);
      if (!isNaN(parsed) && parsed > 0) {
        targetWeightKg =
          state.unit === 'lbs' ? parseFloat((parsed / 2.20462).toFixed(1)) : parsed;
      }
    }

    try {
      await apiPatch<{ onboardingCompleted: boolean }>('/users/me/onboarding', {
        fitness_goal: state.fitness_goal,
        activity_level: state.activity_level,
        target_weight_kg: targetWeightKg,
      });
      router.push('/today');
    } catch {
      dispatch({ type: 'SET_ERROR', message: "Couldn't save your preferences. Check your connection and try again." });
    }
  };

  const resolvedTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: [0, 0, 0.2, 1] as const };

  const progressBars = (
    <div className="mb-6" aria-label={`Step ${state.slide + 1} of 3`}>
      <p className="text-xs text-t3 text-center mb-2">Step {state.slide + 1} of 3</p>
      <div className="flex gap-1.5">
        {([0, 1, 2] as const).map((i) => (
          <div
            key={i}
            className={cn(
              'h-[3px] flex-1 rounded-full',
              i <= state.slide ? 'bg-violet' : 'bg-border-2',
            )}
          />
        ))}
      </div>
    </div>
  );

  const backButton =
    state.slide > 0 ? (
      <button
        type="button"
        onClick={() => dispatch({ type: 'PREV_SLIDE' })}
        aria-label="Go back"
        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-t2 hover:text-t1 -ml-2 mb-4"
      >
        <ChevronLeft size={24} strokeWidth={1.8} />
      </button>
    ) : (
      <div className="min-h-[44px] mb-4" />
    );

  const continueButton = (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      onClick={() => {
        dispatch({ type: 'SET_ERROR', message: null });
        if (state.slide < 2) {
          dispatch({ type: 'NEXT_SLIDE' });
        } else {
          void handleSubmit(false);
        }
      }}
      disabled={!canContinue || state.submitting}
      loading={state.submitting}
    >
      {state.slide < 2 ? 'Continue' : 'Finish setup'}
    </Button>
  );

  return (
    <div className="flex flex-col min-h-0">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="font-display text-4xl font-extrabold tracking-tight leading-none mb-1">
          <span className="text-t1">fit</span>
          <span className="text-violet">NXT</span>
        </div>
        <p className="text-xs text-t2">Let&apos;s personalise your experience</p>
      </div>

      {backButton}
      {progressBars}

      {/* Slide content */}
      <div className="relative overflow-hidden flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={state.slide}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={resolvedTransition}
          >
            {state.slide === 0 && (
              <GoalSlide
                selected={state.fitness_goal}
                onSelect={(goal) => dispatch({ type: 'SET_GOAL', goal })}
              />
            )}
            {state.slide === 1 && (
              <ActivitySlide
                selected={state.activity_level}
                onSelect={(level) => dispatch({ type: 'SET_ACTIVITY', level })}
              />
            )}
            {state.slide === 2 && (
              <WeightSlide
                weight={state.target_weight_kg}
                unit={state.unit}
                onWeightChange={(value) => dispatch({ type: 'SET_WEIGHT', value })}
                onToggleUnit={() => dispatch({ type: 'TOGGLE_UNIT' })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3">
        {state.error && (
          <p role="alert" className="text-sm text-danger mb-2 px-1">
            {state.error}
          </p>
        )}
        {continueButton}
        {state.slide === 2 && (
          <Button
            variant="ghost"
            size="md"
            className="w-full"
            onClick={() => void handleSubmit(true)}
            disabled={state.submitting}
          >
            Skip for now
          </Button>
        )}
      </div>
    </div>
  );
}
