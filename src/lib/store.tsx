import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import { getExercise, modeOf } from '../data/catalog';
import type { ActiveSession, AppState, Energy, ExerciseSettings, SetLog } from '../types';
import {
  STORAGE_KEY,
  createSession,
  finishSession,
  loadState,
  nextIncomplete,
  pauseCountdown,
  restFor,
  sanitize,
  startCountdown,
} from './logic';

export type Action =
  | { type: 'checkIn'; routineId: string; express: boolean; now: number }
  | { type: 'setCurrent'; index: number }
  | { type: 'updateSet'; ex: number; set: number; patch: Partial<SetLog> }
  | { type: 'logSet'; ex: number; set: number; now: number }
  | { type: 'undoSet'; ex: number; set: number }
  | { type: 'addSet'; ex: number }
  | { type: 'removeSet'; ex: number }
  | { type: 'toggleComplete'; ex: number }
  | { type: 'skip'; ex: number }
  | { type: 'timerStart'; key: string; totalMs: number; now: number }
  | { type: 'timerPause'; key: string; now: number }
  | { type: 'timerReset'; key: string }
  | { type: 'timerDone'; key: string; now: number }
  | { type: 'restAdd'; ms: number; now: number }
  | { type: 'restSkip' }
  | { type: 'finish'; energy: Energy | null; now: number }
  | { type: 'discard' }
  | { type: 'updateSettings'; id: string; patch: Partial<ExerciseSettings> }
  | { type: 'setPreferExpress'; value: boolean }
  | { type: 'deleteSession'; id: string }
  | { type: 'replaceState'; state: AppState };

function withActive(state: AppState, fn: (a: ActiveSession) => ActiveSession): AppState {
  return state.active ? { ...state, active: fn(state.active) } : state;
}

function markSetDone(a: ActiveSession, state: AppState, exI: number, setI: number, now: number): ActiveSession {
  const exs = a.exercises.map((e, i) => {
    if (i !== exI) return e;
    const sets = e.sets.map((s, j) => (j === setI ? { ...s, done: true } : s));
    return { ...e, sets, completed: sets.every((s) => s.done) };
  });
  const ex = exs[exI];
  const allDone = exs.every((e) => e.completed || e.skipped);
  let rest = a.rest;
  if (!allDone) {
    const ms = restFor(state, ex.exercise_id) * 1000;
    const nextLabel = ex.completed
      ? (() => {
          const n = nextIncomplete(exs, exI);
          return n >= 0 ? `Next: ${getExercise(exs[n].exercise_id).name}` : 'Nice work';
        })()
      : `Set ${ex.sets.findIndex((s) => !s.done) + 1} up next`;
    rest = { totalMs: ms, remainingMs: ms, endsAt: now + ms, label: nextLabel };
  } else rest = null;
  let currentIndex = a.currentIndex;
  if (ex.completed) {
    const n = nextIncomplete(exs, exI);
    if (n >= 0) currentIndex = n;
  }
  return { ...a, exercises: exs, rest, currentIndex };
}

const allFinished = (a: ActiveSession) => a.exercises.every((e) => e.completed || e.skipped);

function setCompleted(a: ActiveSession, exI: number, completed: boolean, advance: boolean): ActiveSession {
  const exs = a.exercises.map((e, i) => (i === exI ? { ...e, completed, skipped: completed ? false : e.skipped } : e));
  let currentIndex = a.currentIndex;
  if (completed && advance) {
    const n = nextIncomplete(exs, exI);
    if (n >= 0) currentIndex = n;
  }
  const next = { ...a, exercises: exs, currentIndex };
  return allFinished(next) ? { ...next, rest: null } : next;
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'checkIn':
      if (state.active) return state;
      return { ...state, active: createSession(state, action.routineId, action.express, new Date(action.now)), preferExpressNext: false };
    case 'setCurrent':
      return withActive(state, (a) => ({ ...a, currentIndex: Math.max(0, Math.min(action.index, a.exercises.length - 1)) }));
    case 'updateSet':
      // A new weight carries forward to the not-yet-done sets after it (what you'd do on the machine anyway).
      return withActive(state, (a) => ({
        ...a,
        exercises: a.exercises.map((e, i) =>
          i === action.ex
            ? {
                ...e,
                sets: e.sets.map((s, j) =>
                  j === action.set
                    ? { ...s, ...action.patch }
                    : j > action.set && !s.done && action.patch.weight_kg !== undefined
                      ? { ...s, weight_kg: action.patch.weight_kg }
                      : s,
                ),
              }
            : e,
        ),
      }));
    case 'logSet':
      return withActive(state, (a) => markSetDone(a, state, action.ex, action.set, action.now));
    case 'undoSet':
      return withActive(state, (a) => ({
        ...a,
        exercises: a.exercises.map((e, i) =>
          i === action.ex ? { ...e, completed: false, sets: e.sets.map((s, j) => (j === action.set ? { ...s, done: false } : s)) } : e,
        ),
      }));
    case 'addSet':
      return withActive(state, (a) => ({
        ...a,
        exercises: a.exercises.map((e, i) => {
          if (i !== action.ex) return e;
          const last = e.sets[e.sets.length - 1];
          const ex = getExercise(e.exercise_id);
          const fresh: SetLog = last
            ? { ...last, done: false }
            : { weight_kg: modeOf(ex) === 'weights' ? 0 : null, reps: ex.default_reps ?? 10, done: false };
          return { ...e, completed: false, skipped: false, sets: [...e.sets, fresh] };
        }),
      }));
    case 'removeSet':
      return withActive(state, (a) => ({
        ...a,
        exercises: a.exercises.map((e, i) => {
          if (i !== action.ex || e.sets.length <= 1) return e;
          const lastIdx = e.sets.length - 1;
          if (e.sets[lastIdx].done) return e;
          const sets = e.sets.slice(0, lastIdx);
          return { ...e, sets, completed: sets.every((s) => s.done) };
        }),
      }));
    case 'toggleComplete':
      return withActive(state, (a) => setCompleted(a, action.ex, !a.exercises[action.ex].completed, true));
    case 'skip':
      return withActive(state, (a) => {
        const exs = a.exercises.map((e, i) => (i === action.ex ? { ...e, skipped: !e.skipped, completed: false } : e));
        const n = exs[action.ex].skipped ? nextIncomplete(exs, action.ex) : action.ex;
        const next = { ...a, exercises: exs, currentIndex: n >= 0 ? n : a.currentIndex };
        return allFinished(next) ? { ...next, rest: null } : next;
      });
    case 'timerStart':
      return withActive(state, (a) => ({ ...a, timers: { ...a.timers, [action.key]: startCountdown(a.timers[action.key], action.totalMs, action.now) } }));
    case 'timerPause':
      return withActive(state, (a) => {
        const t = a.timers[action.key];
        return t ? { ...a, timers: { ...a.timers, [action.key]: pauseCountdown(t, action.now) } } : a;
      });
    case 'timerReset':
      return withActive(state, (a) => {
        const timers = { ...a.timers };
        delete timers[action.key];
        return { ...a, timers };
      });
    case 'timerDone':
      return withActive(state, (a) => {
        const t = a.timers[action.key];
        if (!t) return a;
        const timers = { ...a.timers, [action.key]: { ...t, endsAt: null, remainingMs: 0 } };
        const [exS, setS] = action.key.split(':');
        const exI = Number(exS);
        if (setS !== undefined) return markSetDone({ ...a, timers }, state, exI, Number(setS), action.now);
        return setCompleted({ ...a, timers }, exI, true, true);
      });
    case 'restAdd':
      return withActive(state, (a) =>
        a.rest && a.rest.endsAt ? { ...a, rest: { ...a.rest, endsAt: a.rest.endsAt + action.ms, totalMs: a.rest.totalMs + action.ms } } : a,
      );
    case 'restSkip':
      return withActive(state, (a) => ({ ...a, rest: null }));
    case 'finish':
      return finishSession(state, action.energy, new Date(action.now));
    case 'discard':
      return { ...state, active: null };
    case 'updateSettings': {
      const cur = state.settings[action.id] ?? { machine: [] };
      return { ...state, settings: { ...state.settings, [action.id]: { ...cur, ...action.patch } } };
    }
    case 'setPreferExpress':
      return { ...state, preferExpressNext: action.value };
    case 'deleteSession':
      return { ...state, sessions: state.sessions.filter((s) => s.session_id !== action.id) };
    case 'replaceState':
      return sanitize(action.state);
  }
}

const Ctx = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadState());
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: keep running in memory */
    }
  }, [state]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside provider');
  return v;
}
