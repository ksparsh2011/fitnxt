'use client';
import { useReducedMotion } from 'framer-motion';
import { getWeekMonday } from '@/lib/dates';
import type { WeekPlanDay } from '@/types/today';

interface WeekStripProps {
  todayDayNumber: number;
  selectedDayNumber: number;
  onSelectDay: (day: number) => void;
  weekPlan: WeekPlanDay[];
}

const DAY_ABBREVS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeekStrip({
  todayDayNumber,
  selectedDayNumber,
  onSelectDay,
  weekPlan,
}: WeekStripProps) {
  const prefersReducedMotion = useReducedMotion();
  const monday = getWeekMonday();

  return (
    <div className="flex gap-1.5" role="tablist" aria-label="Week days">
      {DAY_ABBREVS.map((abbrev, i) => {
        const dayNumber = i + 1; // 1=Mon..7=Sun
        const cellDate = new Date(monday);
        cellDate.setDate(monday.getDate() + i);
        const dateNum = cellDate.getDate();

        const isToday = dayNumber === todayDayNumber;
        const isSelected = dayNumber === selectedDayNumber;
        const planDay = weekPlan.find((d) => d.dayNumber === dayNumber);
        const hasWorkout = planDay?.hasWorkout ?? false;

        let cellClass =
          'flex-1 min-w-0 h-[60px] rounded-[14px] flex flex-col items-center justify-center gap-[2px] transition-colors duration-150 cursor-pointer select-none min-h-[44px]';

        if (isToday) {
          cellClass += ' bg-coral';
        } else if (isSelected) {
          cellClass += ' bg-transparent border-2 border-coral';
        } else if (hasWorkout) {
          cellClass += ' bg-surface-3';
        } else {
          cellClass += ' bg-surface-3 opacity-40';
        }

        return (
          <div
            key={dayNumber}
            className="flex-1 flex flex-col items-center gap-[5px]"
          >
            <button
              role="tab"
              aria-selected={isSelected}
              aria-label={`${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i]}, ${dateNum}${isToday ? ', today' : ''}${hasWorkout ? ', workout scheduled' : ', rest day'}`}
              onClick={() => {
                if (!prefersReducedMotion) {
                  // no animation needed for selection
                }
                onSelectDay(dayNumber);
              }}
              className={cellClass}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span
                className={
                  'text-[9px] font-bold tracking-[0.04em] ' +
                  (isToday ? 'text-white/75' : isSelected ? 'text-coral' : 'text-t2')
                }
              >
                {abbrev}
              </span>
              <span
                className={
                  'font-mono text-[13px] font-semibold leading-none ' +
                  (isToday ? 'text-white' : isSelected ? 'text-coral' : 'text-t1')
                }
              >
                {dateNum}
              </span>
            </button>
            {/* Dot indicator */}
            {(hasWorkout || isToday) && (
              <div
                className={
                  'w-1 h-1 rounded-full ' + (isToday ? 'bg-coral' : 'bg-t3')
                }
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
