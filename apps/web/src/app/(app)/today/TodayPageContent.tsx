'use client';
import { motion } from 'framer-motion';
import { pageContainerVariants } from '@/lib/motion';
import { TodayHeader } from '@/components/today/TodayHeader';
import { WorkoutCard } from '@/components/today/WorkoutCard';
import { MacroRing } from '@/components/today/MacroRing';
import { TodayAITip } from '@/components/today/TodayAITip';
import { QuickLogFAB } from '@/components/today/QuickLogFAB';
import { useWeekPlan } from '@/hooks/useWeekPlan';
import { computeTodayDayNumber } from '@/lib/dates';

export function TodayPageContent() {
  const weekPlan = useWeekPlan();
  const todayDayNumber = computeTodayDayNumber();
  const tomorrowDayNumber = todayDayNumber === 7 ? 1 : todayDayNumber + 1;
  const tomorrowWorkout = weekPlan.data?.find((d) => d.dayNumber === tomorrowDayNumber && d.hasWorkout);
  const tomorrowName = tomorrowWorkout?.name;

  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
      className="px-5 pt-6 pb-4 space-y-4 max-w-[390px] mx-auto"
    >
      <TodayHeader />
      <WorkoutCard tomorrowName={tomorrowName} />
      <MacroRing />
      <TodayAITip />
      <QuickLogFAB />
    </motion.div>
  );
}
