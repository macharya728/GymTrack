import { describe, expect, it } from 'vitest';
import { ROUTINES, modeOf, getExercise, EXERCISES, alternativesFor } from '../data/catalog';
import { TUTORIALS } from '../data/tutorials';
import { reducer } from './store';
import { createSession, initialState, lastPerformance, loadState, sanitize, sessionRatio, suggestWeight, weekDates, isoWeek } from './logic';
import type { AppState } from '../types';

const T0 = new Date(2026, 8, 30, 19, 0).getTime(); // Wed 30 Sep 2026

describe('catalog', () => {
  it('has a tutorial for every exercise', () => {
    for (const e of EXERCISES) expect(TUTORIALS[e.id], e.id).toBeTruthy();
  });
  it('maps modes', () => {
    expect(modeOf(getExercise('chest_press'))).toBe('weights');
    expect(modeOf(getExercise('plank'))).toBe('timedSets');
    expect(modeOf(getExercise('captains_chair_knee_raise'))).toBe('bodyweight');
    expect(modeOf(getExercise('frog_stretch'))).toBe('timer');
    expect(modeOf(getExercise('sauna_session'))).toBe('timer');
    expect(modeOf(getExercise('swim_warmup'))).toBe('check');
  });
});

describe('dates', () => {
  it('builds a Monday-first week', () => {
    expect(weekDates(new Date(T0))).toEqual(['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(weekDates(new Date(2026, 9, 4))[0]).toBe('2026-09-28'); // Sunday belongs to same week
    expect(isoWeek(new Date(T0))).toBe(40);
  });
});

describe('queue', () => {
  it('advances when the suggested routine is finished', () => {
    let s = initialState();
    s = reducer(s, { type: 'checkIn', routineId: ROUTINES[0].id, express: false, now: T0 });
    expect(s.active?.swapped).toBe(false);
    s = reducer(s, { type: 'finish', energy: 'moderate', now: T0 + 3600e3 });
    expect(s.queueIndex).toBe(1);
    expect(s.sessions).toHaveLength(1);
  });
  it('keeps the skipped workout next after a swap', () => {
    let s: AppState = { ...initialState(), queueIndex: 2 };
    s = reducer(s, { type: 'checkIn', routineId: 'workout_b', express: false, now: T0 });
    expect(s.active?.swapped).toBe(true);
    s = reducer(s, { type: 'finish', energy: 'high', now: T0 + 1 });
    expect(s.queueIndex).toBe(2);
  });
  it('wraps after workout 6', () => {
    let s: AppState = { ...initialState(), queueIndex: 5 };
    s = reducer(s, { type: 'checkIn', routineId: 'workout_f', express: true, now: T0 });
    s = reducer(s, { type: 'finish', energy: null, now: T0 + 1 });
    expect(s.queueIndex).toBe(0);
  });
  it('express uses the routine express list', () => {
    const a = createSession(initialState(), 'workout_b', true, new Date(T0));
    expect(a.exercises.map((e) => e.exercise_id)).toEqual(['swim_warmup', 'swim_freestyle_stamina', 'sauna_session']);
  });
  it('low energy turns on express next time, and check-in clears it', () => {
    let s = reducer(initialState(), { type: 'checkIn', routineId: 'workout_a', express: false, now: T0 });
    s = reducer(s, { type: 'finish', energy: 'low', now: T0 + 1 });
    expect(s.preferExpressNext).toBe(true);
    s = reducer(s, { type: 'checkIn', routineId: 'workout_b', express: true, now: T0 + 2 });
    expect(s.preferExpressNext).toBe(false);
  });
  it('ignores a second check-in while a session is active', () => {
    const s = reducer(initialState(), { type: 'checkIn', routineId: 'workout_a', express: false, now: T0 });
    expect(reducer(s, { type: 'checkIn', routineId: 'workout_b', express: false, now: T0 })).toBe(s);
  });
});

describe('sets, rest and progression', () => {
  it('logs a set, starts rest, completes and advances', () => {
    let s = reducer(initialState(), { type: 'checkIn', routineId: 'workout_a', express: true, now: T0 });
    for (let i = 0; i < 3; i++) s = reducer(s, { type: 'updateSet', ex: 0, set: i, patch: { weight_kg: 40, reps: 10 } });
    s = reducer(s, { type: 'logSet', ex: 0, set: 0, now: T0 });
    expect(s.active!.rest?.endsAt).toBe(T0 + 60_000);
    s = reducer(s, { type: 'logSet', ex: 0, set: 1, now: T0 });
    s = reducer(s, { type: 'logSet', ex: 0, set: 2, now: T0 });
    expect(s.active!.exercises[0].completed).toBe(true);
    expect(s.active!.currentIndex).toBe(1);
    expect(sessionRatio(s.active!.exercises)).toBeCloseTo(0.5);
    s = reducer(s, { type: 'finish', energy: 'high', now: T0 + 1 });
    const last = lastPerformance(s.sessions, 'chest_press');
    expect(suggestWeight('chest_press', last, 2.5)).toEqual({ weight: 42.5, up: true });
    // next session pre-fills the suggested weight
    s = reducer(s, { type: 'checkIn', routineId: 'workout_a', express: true, now: T0 + 2 });
    expect(s.active!.exercises[0].sets[0].weight_kg).toBe(42.5);
  });
  it('does not suggest going up when reps were missed', () => {
    const last = { date: 'x', sets: [ { weight_kg: 40, reps: 10, done: true }, { weight_kg: 40, reps: 8, done: true }, { weight_kg: 40, reps: 10, done: true } ] };
    expect(suggestWeight('chest_press', last, 2.5)).toEqual({ weight: 40, up: false });
  });
  it('no rest after the very last set of the session', () => {
    let s = reducer(initialState(), { type: 'checkIn', routineId: 'workout_a', express: true, now: T0 });
    s = reducer(s, { type: 'skip', ex: 1 });
    for (let i = 0; i < 3; i++) s = reducer(s, { type: 'logSet', ex: 0, set: i, now: T0 });
    expect(s.active!.rest).toBeNull();
  });
  it('timed set finishes via timerDone and starts rest', () => {
    let s = reducer(initialState(), { type: 'checkIn', routineId: 'workout_f', express: false, now: T0 });
    s = reducer(s, { type: 'timerStart', key: '3:0', totalMs: 45_000, now: T0 });
    s = reducer(s, { type: 'timerDone', key: '3:0', now: T0 + 45_000 });
    expect(s.active!.exercises[3].sets[0].done).toBe(true);
    expect(s.active!.rest).not.toBeNull();
  });
  it('clears rest once everything is done, and a finished timer moves on', () => {
    let s = reducer(initialState(), { type: 'checkIn', routineId: 'workout_f', express: false, now: T0 });
    for (const ex of [0, 1, 2]) s = reducer(s, { type: 'skip', ex });
    for (const set of [0, 1, 2]) s = reducer(s, { type: 'logSet', ex: 3, set, now: T0 });
    expect(s.active!.rest).not.toBeNull();
    s = reducer(s, { type: 'toggleComplete', ex: 4 });
    expect(s.active!.rest).toBeNull();

    let c = reducer(initialState(), { type: 'checkIn', routineId: 'workout_c', express: false, now: T0 });
    c = reducer(c, { type: 'timerStart', key: '0', totalMs: 45_000, now: T0 });
    c = reducer(c, { type: 'timerDone', key: '0', now: T0 + 45_000 });
    expect(c.active!.exercises[0].completed).toBe(true);
    expect(c.active!.currentIndex).toBe(1);
  });
  it('weight changes carry forward to later un-done sets only', () => {
    let s = reducer(initialState(), { type: 'checkIn', routineId: 'workout_a', express: true, now: T0 });
    s = reducer(s, { type: 'updateSet', ex: 0, set: 0, patch: { weight_kg: 30 } });
    s = reducer(s, { type: 'logSet', ex: 0, set: 0, now: T0 });
    s = reducer(s, { type: 'updateSet', ex: 0, set: 1, patch: { weight_kg: 35 } });
    expect(s.active!.exercises[0].sets.map((x) => x.weight_kg)).toEqual([30, 35, 35]);
  });
  it('pause keeps remaining time', () => {
    let s = reducer(initialState(), { type: 'checkIn', routineId: 'workout_c', express: false, now: T0 });
    s = reducer(s, { type: 'timerStart', key: '0', totalMs: 45_000, now: T0 });
    s = reducer(s, { type: 'timerPause', key: '0', now: T0 + 15_000 });
    expect(s.active!.timers['0']).toMatchObject({ endsAt: null, remainingMs: 30_000 });
    s = reducer(s, { type: 'timerStart', key: '0', totalMs: 45_000, now: T0 + 100_000 });
    expect(s.active!.timers['0'].endsAt).toBe(T0 + 130_000);
  });
});

describe('persistence', () => {
  it('survives the malformed data QA found', () => {
    const bad = (patch: object) => JSON.stringify({ ...initialState(), ...patch });
    const cases = [
      bad({ sessions: [{}] }),
      bad({ settings: { chest_press: {} } }),
      bad({ settings: { chest_press: { machine: [{ label: 1 }], weightStep: -3, videoUrl: 'javascript:alert(1)' } } }),
      bad({ active: { ...createSession(initialState(), 'workout_a', false, new Date(T0)), exercises: [{ exercise_id: 'chest_press' }] } }),
      bad({ sessions: [{ routine_id: 'gone', date: '2026-09-01', checked_in_at: 'x', finished_at: 'y', exercises: [] }] }),
      bad({ queueIndex: 'nope', sessions: [null, 5, 'x'] }),
    ];
    for (const raw of cases) {
      const s = loadState({ getItem: () => raw });
      expect(Array.isArray(s.sessions)).toBe(true);
      for (const x of s.sessions) expect(Array.isArray(x.exercises)).toBe(true);
      for (const v of Object.values(s.settings)) expect(Array.isArray(v.machine)).toBe(true);
      if (s.active) for (const e of s.active.exercises) expect(Array.isArray(e.sets)).toBe(true);
    }
    const repaired = loadState({ getItem: () => cases[3] });
    expect(repaired.active?.exercises[0].sets).toEqual([]);
    expect(loadState({ getItem: () => cases[2] }).settings.chest_press).toEqual({ machine: [] });
  });
  it('keeps valid sessions and drops unknown routines', () => {
    let s = reducer(initialState(), { type: 'checkIn', routineId: 'workout_a', express: true, now: T0 });
    s = reducer(s, { type: 'finish', energy: 'high', now: T0 + 1 });
    const raw = JSON.stringify({ ...s, sessions: [...s.sessions, { ...s.sessions[0], routine_id: 'workout_z', session_id: 'z' }] });
    const out = loadState({ getItem: () => raw });
    expect(out.sessions.map((x) => x.routine_id)).toEqual(['workout_a']);
  });
  it('falls back safely on garbage', () => {
    expect(loadState({ getItem: () => '{not json' })).toEqual(initialState());
    expect(loadState({ getItem: () => JSON.stringify({ hello: 1 }) })).toEqual(initialState());
  });
  it('sanitizes bad queue index and unknown routines', () => {
    const s = sanitize({ ...initialState(), queueIndex: 99, active: { ...createSession(initialState(), 'workout_a', false, new Date(T0)), routine_id: 'gone' } });
    expect(s.queueIndex).toBe(0);
    expect(s.active).toBeNull();
  });
});

describe('equipment busy', () => {
  const start = (id = 'workout_a') => reducer(initialState(), { type: 'checkIn', routineId: id, express: false, now: T0 });

  it('every alternative exists, has a tutorial, and every equipment lift has one', () => {
    for (const r of ROUTINES) for (const id of r.exercises) {
      const e = getExercise(id);
      if (e.category === 'strength' && e.id !== 'plank') expect(alternativesFor(id).length, id).toBeGreaterThan(0);
    }
    for (const id of ['chest_press', 'leg_press', 'sauna_session', 'machine_pec_fly']) {
      for (const a of alternativesFor(id)) expect(TUTORIALS[a.id], a.id).toBeTruthy();
    }
  });
  it('swaps in an alternative, remembers the original, and switches back', () => {
    let s = reducer(start(), { type: 'swapExercise', ex: 0, toId: 'db_bench_press' });
    expect(s.active!.exercises[0].exercise_id).toBe('db_bench_press');
    expect(s.active!.exercises[0].replaced_from).toBe('chest_press');
    s = reducer(s, { type: 'swapExercise', ex: 0, toId: 'pushup' });
    expect(s.active!.exercises[0].replaced_from).toBe('chest_press');
    s = reducer(s, { type: 'swapExercise', ex: 0, toId: 'chest_press' });
    expect(s.active!.exercises[0].exercise_id).toBe('chest_press');
    expect(s.active!.exercises[0].replaced_from).toBeUndefined();
  });
  it('refuses unrelated swaps and swaps after sets are logged', () => {
    let s = start();
    expect(reducer(s, { type: 'swapExercise', ex: 0, toId: 'plank' }).active).toBe(s.active);
    s = reducer(s, { type: 'updateSet', ex: 0, set: 0, patch: { weight_kg: 20 } });
    s = reducer(s, { type: 'logSet', ex: 0, set: 0, now: T0 });
    expect(reducer(s, { type: 'swapExercise', ex: 0, toId: 'db_bench_press' }).active).toBe(s.active);
  });
  it('defers an exercise to the end and re-keys timers', () => {
    let s = start('workout_d');
    const n = s.active!.exercises.length;
    const first = s.active!.exercises[0].exercise_id;
    s = reducer(s, { type: 'timerStart', key: '3', totalMs: 1000, now: T0 });
    s = reducer(s, { type: 'deferExercise', ex: 0 });
    expect(s.active!.exercises[n - 1].exercise_id).toBe(first);
    expect(s.active!.exercises[0].exercise_id).toBe('hamstring_curl');
    expect(Object.keys(s.active!.timers)).toEqual(['2']);
  });
  it('keeps replaced_from through sanitize', () => {
    const s = reducer(start(), { type: 'swapExercise', ex: 0, toId: 'pushup' });
    expect(sanitize(JSON.parse(JSON.stringify(s))).active!.exercises[0].replaced_from).toBe('chest_press');
  });
  it('sauna and steam are each other’s alternative', () => {
    expect(alternativesFor('sauna_session')[0].id).toBe('steam_room_session');
    expect(alternativesFor('steam_room_session')[0].id).toBe('sauna_session');
  });
});
