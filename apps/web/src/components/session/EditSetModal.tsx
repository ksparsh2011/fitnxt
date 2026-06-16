'use client';
import { useEffect, useReducer, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { StepperControl } from '@/components/ui/StepperControl';
import { WORKOUT_CONSTANTS } from '@/lib/workout.constants';
import { formatWeight } from '@/lib/format';

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

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'INC_WEIGHT':
      return { ...state, weightKg: Math.round((state.weightKg + WORKOUT_CONSTANTS.WEIGHT_STEP_KG) * 10) / 10 };
    case 'DEC_WEIGHT':
      return {
        ...state,
        weightKg: Math.max(0, Math.round((state.weightKg - WORKOUT_CONSTANTS.WEIGHT_STEP_KG) * 10) / 10),
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

  const weightDisplay = formatWeight(state.weightKg);

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
        <StepperControl
          label="Weight"
          displayValue={`${weightDisplay} kg`}
          onIncrement={() => dispatch({ type: 'INC_WEIGHT' })}
          onDecrement={() => dispatch({ type: 'DEC_WEIGHT' })}
        />

        {/* Reps stepper */}
        <StepperControl
          label="Reps"
          displayValue={String(state.reps)}
          onIncrement={() => dispatch({ type: 'INC_REPS' })}
          onDecrement={() => dispatch({ type: 'DEC_REPS' })}
        />

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
