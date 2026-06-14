'use client';
import { useState, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Plus, Search, X } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useSessionStore } from '@/stores/session.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ExerciseResult {
  id: string;
  name: string;
  muscleGroups: string[];
  equipment: string;
}

interface ExerciseSearchProps {
  onClose: () => void;
}

export function ExerciseSearch({ onClose }: ExerciseSearchProps) {
  const prefersReducedMotion = useReducedMotion();
  const [search, setSearch] = useState('');
  const isAuthenticated = useAuthStore((s) => s.accessToken !== null);
  const { addExercise } = useSessionStore();

  const { data: results = [] } = useQuery<ExerciseResult[]>({
    queryKey: ['exercises', 'search', search],
    queryFn: () =>
      apiGet<ExerciseResult[]>(`/workouts/exercises?search=${encodeURIComponent(search)}`).then(
        (r) => r ?? [],
      ),
    enabled: search.length >= 2 && isAuthenticated,
    staleTime: 30_000,
  });

  const { mutate: createCustom, isPending: isCreating } = useMutation({
    mutationFn: (name: string) =>
      apiPost<ExerciseResult>('/workouts/exercises', { name }),
    onSuccess: (exercise) => {
      if (exercise) handleSelect(exercise);
    },
  });

  const handleSelect = useCallback(
    (exercise: ExerciseResult) => {
      addExercise({
        exerciseId: exercise.id,
        name: exercise.name,
        prescribedSets: 3,
        prescribedReps: 10,
      });
      onClose();
    },
    [addExercise, onClose],
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={prefersReducedMotion ? {} : { y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.38, ease: [0, 0, 0.2, 1] }}
          className="absolute bottom-0 inset-x-0 bg-surface rounded-t-4xl px-5 pt-5 pb-[env(safe-area-inset-bottom)]"
          style={{ maxHeight: '80vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="w-10 h-1 rounded-full bg-border-2 mx-auto mb-5" />

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-t1">Add Exercise</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close exercise search"
            >
              <X className="w-5 h-5" strokeWidth={1.8} />
            </Button>
          </div>

          <div className="mb-4">
            <Input
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leadingIcon={<Search className="w-4 h-4" strokeWidth={1.8} />}
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="overflow-y-auto" style={{ maxHeight: '50vh' }}>
            {search.length >= 2 && results.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-6">
                <p className="text-sm text-t2">No exercises found for &ldquo;{search}&rdquo;</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => createCustom(search)}
                  loading={isCreating}
                  className="text-coral hover:text-coral border border-coral/30 bg-coral/10 hover:bg-coral/20"
                >
                  <Plus size={16} strokeWidth={1.8} />
                  {isCreating ? 'Adding…' : `Add "${search}" as custom`}
                </Button>
              </div>
            )}
            {search.length < 2 && (
              <p className="text-sm text-t2 text-center py-6">Type to search exercises</p>
            )}
            <div className="flex flex-col gap-2">
              {results.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => handleSelect(exercise)}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl bg-surface-2 border border-border hover:border-border-2 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-t1 truncate">{exercise.name}</div>
                    <div className="text-xs text-t2 truncate">
                      {exercise.muscleGroups.join(', ')} · {exercise.equipment}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
