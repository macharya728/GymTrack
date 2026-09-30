export type Category = 'strength' | 'stretch' | 'swim' | 'recovery';

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  equipment: string;
  target_muscle: string;
  cues: string;
  default_sets?: number;
  default_reps?: number;
  duration_seconds?: number;
  target_distance_m?: number;
  is_core_express: boolean;
}

export interface Routine {
  id: string;
  day_name: string;
  title: string;
  subtitle: string;
  exercises: string[];
  express_exercise_ids: string[];
}

/** How an exercise is logged in a session. */
export type ExerciseMode =
  | 'weights' // sets × reps with a weight stepper
  | 'bodyweight' // sets × reps, no weight
  | 'timedSets' // sets of a fixed hold (plank)
  | 'timer' // single countdown (stretches, sauna, steam)
  | 'check'; // tap-to-complete phase (swim)

export interface SetLog {
  weight_kg: number | null;
  reps: number | null;
  duration_s?: number;
  done: boolean;
}

export interface ExerciseLog {
  exercise_id: string;
  completed: boolean;
  skipped?: boolean;
  sets: SetLog[];
}

export interface Countdown {
  /** epoch ms when it finishes while running; null when paused/idle */
  endsAt: number | null;
  /** remaining ms when paused/idle */
  remainingMs: number;
  totalMs: number;
}

export interface ActiveSession {
  session_id: string;
  date: string; // local YYYY-MM-DD of check-in
  routine_id: string;
  checked_in_at: string; // ISO
  is_express: boolean;
  swapped: boolean;
  exercises: ExerciseLog[];
  currentIndex: number;
  rest: (Countdown & { label: string }) | null;
  /** keyed by `${exerciseIndex}` or `${exerciseIndex}:${setIndex}` */
  timers: Record<string, Countdown>;
}

export type Energy = 'high' | 'moderate' | 'low';

export interface SessionLog {
  session_id: string;
  date: string;
  routine_id: string;
  checked_in_at: string;
  finished_at: string;
  is_express: boolean;
  swapped: boolean;
  completed_ratio: number;
  exercises: ExerciseLog[];
  energy_rating: Energy | null;
}

export interface MachineSetting {
  label: string;
  value: string;
}

export interface ExerciseSettings {
  machine: MachineSetting[];
  weightStep?: number;
  restSeconds?: number;
  videoUrl?: string;
}

export interface AppState {
  version: 1;
  queueIndex: number;
  sessions: SessionLog[];
  active: ActiveSession | null;
  settings: Record<string, ExerciseSettings>;
  preferExpressNext: boolean;
}
