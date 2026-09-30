import { EXERCISES, ROUTINES, defaultRest, defaultWeightStep, getExercise, getRoutine, modeOf } from '../data/catalog';
import type { ActiveSession, AppState, Countdown, Energy, ExerciseLog, ExerciseSettings, MachineSetting, SessionLog, SetLog } from '../types';

// ---------- dates ----------
export const pad2 = (n: number) => String(n).padStart(2, '0');
export const localDate = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const parseLocal = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
/** Monday-first dates of the week containing `d`. */
export function weekDates(d = new Date()): string[] {
  const day = (d.getDay() + 6) % 7; // Mon=0
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => localDate(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i)));
}
/** ISO-8601 week number. */
export function isoWeek(d = new Date()): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ---------- state ----------
export const initialState = (): AppState => ({
  version: 1,
  queueIndex: 0,
  sessions: [],
  active: null,
  settings: {},
  preferExpressNext: false,
});

export const settingsFor = (s: AppState, id: string): ExerciseSettings => s.settings[id] ?? { machine: [] };
export const weightStepFor = (s: AppState, id: string) => settingsFor(s, id).weightStep ?? defaultWeightStep(id);
export const restFor = (s: AppState, id: string) => settingsFor(s, id).restSeconds ?? defaultRest(id);

// ---------- history ----------
export interface LastPerformance {
  date: string;
  sets: SetLog[];
}
/** Most recent finished session where this exercise had at least one done set (or was completed). */
export function lastPerformance(sessions: SessionLog[], exerciseId: string): LastPerformance | null {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const log = sessions[i].exercises.find((e) => e.exercise_id === exerciseId);
    if (!log) continue;
    const done = log.sets.filter((s) => s.done);
    if (done.length || log.completed) return { date: sessions[i].date, sets: done };
  }
  return null;
}

export interface Suggestion {
  weight: number;
  up: boolean;
}
/** Progression hint: if every target set hit target reps last time, suggest one step up. */
export function suggestWeight(exerciseId: string, last: LastPerformance | null, step: number): Suggestion | null {
  const ex = getExercise(exerciseId);
  if (modeOf(ex) !== 'weights' || !last || !last.sets.length) return null;
  const weights = last.sets.map((s) => s.weight_kg ?? 0);
  const top = Math.max(...weights);
  if (top <= 0) return null;
  const targetSets = ex.default_sets ?? 3;
  const targetReps = ex.default_reps ?? 10;
  const atTop = last.sets.filter((s) => (s.weight_kg ?? 0) === top);
  const hitAll = last.sets.length >= targetSets && atTop.length >= targetSets && atTop.every((s) => (s.reps ?? 0) >= targetReps);
  return hitAll ? { weight: round(top + step), up: true } : { weight: top, up: false };
}
const round = (n: number) => Math.round(n * 100) / 100;

// ---------- sessions ----------
export function buildExerciseLog(state: AppState, exerciseId: string): ExerciseLog {
  const ex = getExercise(exerciseId);
  const mode = modeOf(ex);
  const n = ex.default_sets ?? 3;
  let sets: SetLog[] = [];
  if (mode === 'weights') {
    const last = lastPerformance(state.sessions, exerciseId);
    const sug = suggestWeight(exerciseId, last, weightStepFor(state, exerciseId));
    const w = sug?.weight ?? 0;
    sets = Array.from({ length: n }, () => ({ weight_kg: w, reps: ex.default_reps ?? 10, done: false }));
  } else if (mode === 'bodyweight') {
    sets = Array.from({ length: n }, () => ({ weight_kg: null, reps: ex.default_reps ?? 10, done: false }));
  } else if (mode === 'timedSets') {
    sets = Array.from({ length: n }, () => ({ weight_kg: null, reps: null, duration_s: ex.duration_seconds ?? 45, done: false }));
  }
  return { exercise_id: exerciseId, completed: false, sets };
}

export function createSession(state: AppState, routineId: string, express: boolean, now: Date): ActiveSession {
  const r = getRoutine(routineId);
  const ids = express ? r.express_exercise_ids : r.exercises;
  return {
    session_id: `sess_${now.getTime()}`,
    date: localDate(now),
    routine_id: routineId,
    checked_in_at: now.toISOString(),
    is_express: express,
    swapped: ROUTINES[state.queueIndex]?.id !== routineId,
    exercises: ids.map((id) => buildExerciseLog(state, id)),
    currentIndex: 0,
    rest: null,
    timers: {},
  };
}

export function exerciseFraction(log: ExerciseLog): number {
  if (log.completed) return 1;
  if (log.sets.length) return log.sets.filter((s) => s.done).length / log.sets.length;
  return 0;
}
export function sessionRatio(exs: ExerciseLog[]): number {
  if (!exs.length) return 0;
  return exs.reduce((a, e) => a + exerciseFraction(e), 0) / exs.length;
}

export function nextQueueIndex(queueIndex: number, finishedRoutineId: string): number {
  return ROUTINES[queueIndex]?.id === finishedRoutineId ? (queueIndex + 1) % ROUTINES.length : queueIndex;
}

export function finishSession(state: AppState, energy: Energy | null, now: Date): AppState {
  const a = state.active;
  if (!a) return state;
  const log: SessionLog = {
    session_id: a.session_id,
    date: a.date,
    routine_id: a.routine_id,
    checked_in_at: a.checked_in_at,
    finished_at: now.toISOString(),
    is_express: a.is_express,
    swapped: a.swapped,
    completed_ratio: round(sessionRatio(a.exercises)),
    exercises: a.exercises,
    energy_rating: energy,
  };
  return {
    ...state,
    active: null,
    sessions: [...state.sessions, log],
    queueIndex: nextQueueIndex(state.queueIndex, a.routine_id),
    preferExpressNext: energy === 'low',
  };
}

/** Index of the first unfinished exercise after `from` (wrapping), or -1. */
export function nextIncomplete(exs: ExerciseLog[], from: number): number {
  for (let k = 1; k <= exs.length; k++) {
    const i = (from + k) % exs.length;
    if (!exs[i].completed && !exs[i].skipped) return i;
  }
  return -1;
}

// ---------- countdowns ----------
export const remainingMs = (c: Countdown, now: number) => (c.endsAt != null ? Math.max(0, c.endsAt - now) : c.remainingMs);
export const startCountdown = (c: Countdown | undefined, totalMs: number, now: number): Countdown => {
  const rem = c && c.remainingMs > 0 ? c.remainingMs : totalMs;
  return { totalMs: c?.totalMs ?? totalMs, remainingMs: rem, endsAt: now + rem };
};
export const pauseCountdown = (c: Countdown, now: number): Countdown => ({ ...c, endsAt: null, remainingMs: remainingMs(c, now) });

export function volumeKg(exs: ExerciseLog[]): number {
  return exs.reduce((a, e) => a + e.sets.filter((s) => s.done).reduce((b, s) => b + (s.weight_kg ?? 0) * (s.reps ?? 0), 0), 0);
}

// ---------- persistence ----------
export const STORAGE_KEY = 'gymtrack:v1';

export function isAppState(x: unknown): x is AppState {
  if (!x || typeof x !== 'object') return false;
  const s = x as AppState;
  return s.version === 1 && Array.isArray(s.sessions);
}

/**
 * Deep-repairs stored or restored state. Anything that doesn't match the current
 * seed (removed routines/exercises) or is malformed is dropped, never thrown on.
 */
export function sanitize(s: AppState): AppState {
  const exIds = new Set(EXERCISES.map((e) => e.id));
  const rIds = new Set(ROUTINES.map((r) => r.id));
  const obj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
  const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);
  const str = (x: unknown): x is string => typeof x === 'string';

  const cleanSet = (x: unknown): SetLog | null => {
    if (!obj(x)) return null;
    const out: SetLog = { weight_kg: num(x.weight_kg), reps: num(x.reps), done: x.done === true };
    const d = num(x.duration_s);
    if (d != null) out.duration_s = d;
    return out;
  };
  const cleanEx = (x: unknown): ExerciseLog | null => {
    if (!obj(x) || !str(x.exercise_id) || !exIds.has(x.exercise_id)) return null;
    const sets = Array.isArray(x.sets) ? x.sets.map(cleanSet).filter((v): v is SetLog => !!v) : [];
    return { exercise_id: x.exercise_id, completed: x.completed === true, skipped: x.skipped === true, sets };
  };
  const cleanCountdown = (x: unknown): Countdown | null => {
    if (!obj(x)) return null;
    const total = num(x.totalMs);
    const rem = num(x.remainingMs);
    if (total == null || rem == null) return null;
    return { totalMs: total, remainingMs: rem, endsAt: num(x.endsAt) };
  };
  const isDate = (x: unknown): x is string => str(x) && /^\d{4}-\d{2}-\d{2}$/.test(x);
  const isIso = (x: unknown): x is string => str(x) && !Number.isNaN(Date.parse(x));

  const sessions: SessionLog[] = [];
  for (const x of Array.isArray(s.sessions) ? (s.sessions as unknown[]) : []) {
    if (!obj(x) || !str(x.routine_id) || !rIds.has(x.routine_id) || !isDate(x.date) || !isIso(x.checked_in_at) || !isIso(x.finished_at)) continue;
    const exercises = Array.isArray(x.exercises) ? x.exercises.map(cleanEx).filter((v): v is ExerciseLog => !!v) : [];
    const energy = x.energy_rating;
    sessions.push({
      session_id: str(x.session_id) ? x.session_id : `sess_${Date.parse(x.checked_in_at)}_${sessions.length}`,
      date: x.date,
      routine_id: x.routine_id,
      checked_in_at: x.checked_in_at,
      finished_at: x.finished_at,
      is_express: x.is_express === true,
      swapped: x.swapped === true,
      completed_ratio: Math.max(0, Math.min(1, num(x.completed_ratio) ?? sessionRatio(exercises))),
      exercises,
      energy_rating: energy === 'high' || energy === 'moderate' || energy === 'low' ? energy : null,
    });
  }
  // keep ids unique (delete-by-id relies on it)
  const seen = new Set<string>();
  for (const x of sessions) {
    while (seen.has(x.session_id)) x.session_id += '_';
    seen.add(x.session_id);
  }

  let active: ActiveSession | null = null;
  const a = s.active as unknown;
  if (obj(a) && str(a.routine_id) && rIds.has(a.routine_id) && isDate(a.date) && isIso(a.checked_in_at) && Array.isArray(a.exercises)) {
    const exercises = a.exercises.map(cleanEx).filter((v): v is ExerciseLog => !!v);
    if (exercises.length) {
      const timers: Record<string, Countdown> = {};
      if (obj(a.timers)) for (const [k, v] of Object.entries(a.timers)) {
        const c = cleanCountdown(v);
        if (c && /^\d+(:\d+)?$/.test(k)) timers[k] = c;
      }
      const restC = cleanCountdown(a.rest);
      const ci = num(a.currentIndex) ?? 0;
      active = {
        session_id: str(a.session_id) ? a.session_id : `sess_${Date.parse(a.checked_in_at)}`,
        date: a.date,
        routine_id: a.routine_id,
        checked_in_at: a.checked_in_at,
        is_express: a.is_express === true,
        swapped: a.swapped === true,
        exercises,
        currentIndex: Math.max(0, Math.min(exercises.length - 1, Math.floor(ci))),
        rest: restC && obj(a.rest) ? { ...restC, label: str(a.rest.label) ? a.rest.label : 'Rest' } : null,
        timers,
      };
    }
  }

  const settings: Record<string, ExerciseSettings> = {};
  if (obj(s.settings)) for (const [id, v] of Object.entries(s.settings as Record<string, unknown>)) {
    if (!exIds.has(id) || !obj(v)) continue;
    const machine = Array.isArray(v.machine)
      ? v.machine.filter((m): m is MachineSetting => obj(m) && str(m.label) && str(m.value)).map((m) => ({ label: m.label.slice(0, 20), value: m.value.slice(0, 12) }))
      : [];
    const step = num(v.weightStep);
    const rest = num(v.restSeconds);
    const out: ExerciseSettings = { machine };
    if (step != null && step > 0 && step <= 20) out.weightStep = step;
    if (rest != null && rest > 0 && rest <= 600) out.restSeconds = rest;
    if (str(v.videoUrl) && /^https:\/\//i.test(v.videoUrl)) out.videoUrl = v.videoUrl;
    settings[id] = out;
  }

  const qi = s.queueIndex;
  return {
    version: 1,
    queueIndex: Number.isInteger(qi) && qi >= 0 && qi < ROUTINES.length ? qi : 0,
    sessions,
    active,
    settings,
    preferExpressNext: s.preferExpressNext === true,
  };
}

export function loadState(storage: Pick<Storage, 'getItem'> = localStorage): AppState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    return isAppState(parsed) ? sanitize(parsed) : initialState();
  } catch {
    return initialState();
  }
}
