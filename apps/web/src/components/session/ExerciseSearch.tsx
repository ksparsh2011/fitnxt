'use client';
import { useState, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useSessionStore } from '@/stores/session.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useDebounce } from '@/hooks/useDebounce';

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
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const isAuthenticated = useAuthStore((s) => s.accessToken !== null);
  const { addExercise } = useSessionStore();

  const { data: results = [] } = useQuery<ExerciseResult[]>({
    queryKey: ['exercises', 'search', debouncedSearch],
    queryFn: () =>
      apiGet<ExerciseResult[]>(
        `/workouts/exercises?search=${encodeURIComponent(debouncedSearch)}`,
      ).then((r) => r ?? []),
    enabled: debouncedSearch.length >= 2 && isAuthenticated,
    staleTime: 30_000,
  });

  const { mutate: createCustom, isPending: isCreating } = useMutation({
    mutationFn: (name: string) => apiPost<ExerciseResult>('/workouts/exercises', { name }),
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
        repsMin: 8,
        repsMax: 12,
        restSeconds: 90,
      });
      onClose();
    },
    [addExercise, onClose],
  );

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Add Exercise">
      <div className="px-5 pb-[env(safe-area-inset-bottom,16px)]">
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
        <div className="overflow-y-auto" style={{ maxHeight: '50dvh' }}>
          {debouncedSearch.length >= 2 && results.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-base text-t2">
                No exercises found for &ldquo;{debouncedSearch}&rdquo;
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => createCustom(debouncedSearch)}
                loading={isCreating}
                className="text-coral hover:text-coral border border-coral/30 bg-coral/10 hover:bg-coral/20"
              >
                <Plus size={16} strokeWidth={1.8} />
                {isCreating ? 'Adding…' : `Add "${debouncedSearch}" as custom`}
              </Button>
            </div>
          )}
          {debouncedSearch.length < 2 && (
            <p className="text-base text-t2 text-center py-6">Type to search exercises</p>
          )}
          <div className="flex flex-col gap-2">
            {results.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => handleSelect(exercise)}
                className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl bg-surface-2 border border-border hover:border-border-2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-base font-medium text-t1 truncate">{exercise.name}</div>
                  <div className="text-xs text-t2 truncate">
                    {exercise.muscleGroups.join(', ')} · {exercise.equipment}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
