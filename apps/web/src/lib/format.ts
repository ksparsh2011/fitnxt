/** Formats a weight in kg, omitting the decimal point if it's a whole number. */
export function formatWeight(kg: number): string {
  return kg % 1 === 0 ? `${kg}` : `${kg.toFixed(1)}`;
}

/** Formats a duration in seconds as mm:ss. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Formats a muscle group slug (e.g. "chest_fly" → "Chest Fly"). */
export function formatMuscleGroup(raw: string): string {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Formats volume in kg, showing tonnes for values ≥ 1000. */
export function formatVolume(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${kg}kg`;
}
