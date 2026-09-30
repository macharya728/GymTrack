import seed from './seed.json';
import type { Category, Exercise, ExerciseMode, Routine } from '../types';

export const EXERCISES: Exercise[] = seed.exercises as Exercise[];
export const ROUTINES: Routine[] = seed.routines as Routine[];

const byId = new Map(EXERCISES.map((e) => [e.id, e]));
export const getExercise = (id: string): Exercise => {
  const e = byId.get(id);
  if (!e) throw new Error(`Unknown exercise: ${id}`);
  return e;
};
export const getRoutine = (id: string): Routine => {
  const r = ROUTINES.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown routine: ${id}`);
  return r;
};
export const routineNumber = (id: string) => ROUTINES.findIndex((r) => r.id === id) + 1;

/** Exercises that are logged without a weight. */
const BODYWEIGHT = new Set(['captains_chair_knee_raise', 'plank']);

/** Default weight step per exercise (kg). Dumbbells usually jump in 2 kg. */
const WEIGHT_STEP: Record<string, number> = { goblet_squat: 2 };

/** Default rest per exercise (s). Big compound lifts get longer. */
const REST: Record<string, number> = { leg_press: 90, goblet_squat: 90 };

export function modeOf(e: Exercise): ExerciseMode {
  if (e.category === 'swim') return 'check';
  if (e.category === 'stretch' || e.category === 'recovery') return 'timer';
  if (e.duration_seconds) return 'timedSets';
  if (BODYWEIGHT.has(e.id)) return 'bodyweight';
  return 'weights';
}

export const defaultWeightStep = (id: string) => WEIGHT_STEP[id] ?? 2.5;
export const defaultRest = (id: string) => REST[id] ?? 60;

export const isSwimRoutine = (r: Routine) => r.exercises.some((id) => getExercise(id).category === 'swim');

/** Dominant category, ignoring the heat/recovery finisher. */
export function routineCategory(r: Routine): Category {
  const counts: Partial<Record<Category, number>> = {};
  for (const id of r.exercises) {
    const c = getExercise(id).category;
    if (c !== 'recovery') counts[c] = (counts[c] ?? 0) + 1;
  }
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as Category) ?? 'recovery';
}

export function routineSummary(r: Routine) {
  const exs = r.exercises.map(getExercise);
  const swimM = exs.reduce((a, e) => a + (e.target_distance_m ?? 0), 0);
  const count = (c: Category) => exs.filter((e) => e.category === c).length;
  return { swimM, strength: count('strength'), stretch: count('stretch'), heat: exs.find((e) => e.category === 'recovery') };
}

/** Rough duration estimate in minutes. */
export function estimateMinutes(ids: string[]): number {
  let s = 0;
  for (const id of ids) {
    const e = getExercise(id);
    const m = modeOf(e);
    if (m === 'weights' || m === 'bodyweight') s += (e.default_sets ?? 3) * (45 + defaultRest(id)) + 60;
    else if (m === 'timedSets') s += (e.default_sets ?? 3) * ((e.duration_seconds ?? 45) + 45);
    else if (m === 'timer') s += (e.duration_seconds ?? 45) * (e.category === 'stretch' ? 2 : 1) + 30;
    else s += ((e.target_distance_m ?? 100) / 100) * 150;
  }
  return Math.max(5, Math.round(s / 60 / 5) * 5);
}

const SHORT: Record<string, string> = {
  steam_room_session: 'Steam',
  sauna_session: 'Sauna',
  swim_freestyle_stamina: 'Stamina 4×50',
  swim_intervals: 'Sprint intervals',
  swim_warmup: 'Warm-up swim',
  goblet_squat: 'Goblet squat',
  machine_shoulder_press: 'Shoulder press',
};
export const shortName = (id: string) =>
  SHORT[id] ??
  getExercise(id)
    .name.replace(/^(Seated |Machine |Light Dumbbell |Kneeling )/, '')
    .replace(/ (Stretch|Machine)$/, '');

export const CATEGORY_META: Record<Category, { label: string; color: string; tint: string }> = {
  strength: { label: 'Strength', color: 'text-strength', tint: 'bg-strength/15' },
  stretch: { label: 'Stretch', color: 'text-stretch', tint: 'bg-stretch/15' },
  swim: { label: 'Swim', color: 'text-swim', tint: 'bg-swim/15' },
  recovery: { label: 'Heat', color: 'text-heat', tint: 'bg-heat/15' },
};
