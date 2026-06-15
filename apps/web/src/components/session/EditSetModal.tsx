'use client';
import { useEffect, useReducer, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface EditSetModalProps {
  set: { localId: string; weightKg: number | null; reps: number; setId?: string };
  onSave: (weightKg: number, reps: number) => void;
  onDelete: () => void;
  onClose: () => void;
}

interface EditorState {
  weightKg: number;
  reps: number;
}

type EditorAction =
  | { type: 'INC_WEIGHT' }
  | { type: 'DEC_WEIGHT' }
  | { type: 'INC_REPS' }
  | { type: 'DEC_REPS' };

const WEIGHT_STEP = 2.5;

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'INC_WEIGHT':
      return { ...state, weightKg: Math.round((state.weightKg + WEIGHT_STEP) * 10) / 10 };
    case 'DEC_WEIGHT':
      return {
        ...state,
        weightKg: Math.max(0, Math.round((state.weightKg - WEIGHT_STEP) * 10) / 10),
      };
    case 'INC_REPS':
      return { ...state, reps: state.reps + 1 };
    case 'DEC_REPS':
      return { ...state, reps: Math.max(1, state.reps - 1) };
    default:
      return state;
  }
}

export function EditSetModal({ set, onSave, onDelete, onClose }: EditSetModalProps) {
  const [state, dispatch] = useReducer(editorReducer, {
    weightKg: set.weightKg ?? 0,
    reps: set.reps,
  });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const weightDisplay =
    state.weightKg % 1 === 0 ? String(state.weightKg) : state.weightKg.toFixed(1);

  const handleDeletePress = () => {
    if (deleteConfirm) {
      if (deleteTimerRef.current !== null) clearTimeout(deleteTimerRef.current);
      onDelete();
      return;
    }
    setDeleteConfirm(true);
    deleteTimerRef.current = setTimeout(() => setDeleteConfirm(false), 3000);
  };

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current !== null) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Edit Set">
      <div className="px-5 pb-[env(safe-area-inset-bottom,24px)] flex flex-col gap-5">
        {/* Weight stepper */}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-t2">Weight</span>
          <div className="flex items-center">
            <button
              onClick={() => dispatch({ type: 'DEC_WEIGHT' })}
              className="w-12 h-12 rounded-l-xl bg-surface-3 border border-border text-t1 flex items-center justify-center active:bg-surface-4 transition-colors"
              aria-label="Decrease weight"
            >
              <Minus className="w-4 h-4" strokeWidth={1.8} />
            </button>
            <div className="w-24 h-12 bg-surface-2 border-t border-b border-border flex items-center justify-center font-mono text-base font-medium text-t1">
              {weightDisplay} kg
            </div>
            <button
              onClick={() => dispatch({ type: 'INC_WEIGHT' })}
              className="w-12 h-12 rounded-r-xl bg-surface-3 border border-border text-t1 flex items-center justify-center active:bg-surface-4 transition-colors"
              aria-label="Increase weight"
            >
              <Plus className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Reps stepper */}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-t2">Reps</span>
          <div className="flex items-center">
            <button
              onClick={() => dispatch({ type: 'DEC_REPS' })}
              className="w-12 h-12 rounded-l-xl bg-surface-3 border border-border text-t1 flex items-center justify-center active:bg-surface-4 transition-colors"
              aria-label="Decrease reps"
            >
              <Minus className="w-4 h-4" strokeWidth={1.8} />
            </button>
            <div className="w-24 h-12 bg-surface-2 border-t border-b border-border flex items-center justify-center font-mono text-base font-medium text-t1">
              {state.reps}
            </div>
            <button
              onClick={() => dispatch({ type: 'INC_REPS' })}
              className="w-12 h-12 rounded-r-xl bg-surface-3 border border-border text-t1 flex items-center justify-center active:bg-surface-4 transition-colors"
              aria-label="Increase reps"
            >
              <Plus className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Save button */}
        <Button
          variant="coral"
          size="lg"
          className="w-full"
          onClick={() => onSave(state.weightKg, state.reps)}
        >
          Save Changes
        </Button>

        {/* Delete button — two-tap confirm */}
        {/* TODO: PATCH /workouts/sessions/:sessionId/sets/:setId when backend supports it */}
        <Button
          variant={deleteConfirm ? 'danger' : 'ghost'}
          size="md"
          className="w-full"
          onClick={handleDeletePress}
        >
          {deleteConfirm ? 'Tap again to delete' : 'Delete Set'}
        </Button>
      </div>
    </BottomSheet>
  );
}
