import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, Check, ChevronDown, Droplet, History as HistoryIcon, Info, Minus, Pause, Play, Plus, RotateCcw, SkipForward, Timer, TrendingUp } from 'lucide-react';
import { useNav } from '../App';
import { useStore } from '../lib/store';
import { getExercise, getRoutine, modeOf, routineNumber } from '../data/catalog';
import { lastPerformance, remainingMs, restFor, sessionRatio, settingsFor, suggestWeight, weightStepFor, parseLocal } from '../lib/logic';
import { fmtClock, fmtElapsed, fmtKg } from '../lib/hooks';
import { tapFeedback, unlockAudio } from '../lib/device';
import { Btn, CATEGORY_HEX, Chip, HEX, IconBtn, Ring, Sheet, cx, CATEGORY_ICON } from '../components/ui';
import type { ActiveSession, ExerciseLog, SetLog } from '../types';

export default function Session() {
  const { state } = useStore();
  const nav = useNav();
  const a = state.active!;
  const r = getRoutine(a.routine_id);
  const ratio = sessionRatio(a.exercises);
  const curRef = useRef<HTMLDivElement>(null);

  // bring the expanded card into view when it changes (not on first open)
  const firstIndex = useRef(a.currentIndex);
  useEffect(() => {
    if (firstIndex.current === a.currentIndex) return;
    firstIndex.current = -1;
    curRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [a.currentIndex]);

  const swim = a.exercises.map((e) => getExercise(e.exercise_id)).filter((e) => e.category === 'swim');
  const swimTotal = swim.reduce((s, e) => s + (e.target_distance_m ?? 0), 0);
  const swimDone = a.exercises.reduce((s, e) => {
    const ex = getExercise(e.exercise_id);
    return s + (ex.category === 'swim' && e.completed ? ex.target_distance_m ?? 0 : 0);
  }, 0);
  const allDone = a.exercises.every((e) => e.completed || e.skipped);

  const finish = () => {
    if (allDone) nav.open({ kind: 'finish' });
    else nav.open({ kind: 'sheet', id: 'finish-confirm' });
  };

  return (
    <div className={cx('pt-safe', a.rest ? 'pb-40' : 'pb-10')}>
      <SessionBar a={a} title={r.title} sub={`Workout ${routineNumber(r.id)}${a.is_express ? ' · Express' : ''}${a.swapped ? ' · Swapped in' : ''}`} />

      <main className="flex flex-col gap-3 px-4 pt-3">
        {swimTotal > 0 && (
          <section className="rounded-[20px] border border-swim/25 bg-swim/[0.08] p-4" aria-label="Swim distance">
            <div className="flex items-end justify-between gap-2">
              <p className="font-display leading-none">
                <span className="text-5xl font-bold tabular">{swimDone}</span>
                <span className="ml-1.5 text-2xl font-semibold text-muted">/ {swimTotal} m</span>
              </p>
              <p className="text-[13px] text-muted">
                {swimDone / 25} of {swimTotal / 25} lengths · 25 m pool
              </p>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded bg-line">
              <div className="h-full rounded bg-swim transition-[width] duration-300" style={{ width: `${(swimDone / swimTotal) * 100}%` }} />
            </div>
          </section>
        )}

        {a.exercises.map((log, i) =>
          i === a.currentIndex ? (
            <div key={i} ref={curRef} className="scroll-mt-28">
              <ExerciseCard log={log} i={i} total={a.exercises.length} />
            </div>
          ) : (
            <CollapsedRow key={i} log={log} i={i} />
          ),
        )}

        <Btn variant={allDone ? 'primary' : 'outline'} size="lg" className="mt-3" onClick={finish}>
          <Check size={22} strokeWidth={3} aria-hidden /> Finish workout
        </Btn>
        <p className="text-center text-xs text-dim">{Math.round(ratio * 100)}% done · the workout keeps running if you go back</p>
      </main>

      {a.rest && <RestBar />}

      {nav.sheetOpen('finish-confirm') && (
        <Sheet onClose={nav.back} label="Finish early?">
          <h2 className="font-display text-[28px] font-bold">Finish now?</h2>
          <p className="mt-2 text-[15px] leading-6 text-muted">
            You&rsquo;re {Math.round(ratio * 100)}% through. Whatever isn&rsquo;t done just gets logged as not done. Showing up still counts.
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <Btn
              variant="primary"
              onClick={() => nav.replaceTop({ kind: 'finish' })}
            >
              Finish workout
            </Btn>
            <Btn variant="secondary" onClick={nav.back}>
              Keep going
            </Btn>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function SessionBar({ a, title, sub }: { a: ActiveSession; title: string; sub: string }) {
  const nav = useNav();
  const { dispatch } = useStore();
  return (
    <header className="sticky top-0 z-20 bg-bg/95 pb-2 pt-1 backdrop-blur">
      <div className="flex items-center gap-1 pl-2 pr-4">
        <IconBtn label="Back to home. The workout keeps running." onClick={nav.back}>
          <ArrowLeft size={24} aria-hidden />
        </IconBtn>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">{sub}</p>
          <h1 className="truncate text-[17px] font-semibold">{title}</h1>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-surf px-3 py-2 text-[15px] font-semibold tabular" aria-label="Time elapsed">
          <Timer size={16} className="text-muted" aria-hidden />
          {fmtElapsed(nav.now - Date.parse(a.checked_in_at))}
        </span>
      </div>
      <div className="flex gap-1 px-4" role="tablist" aria-label="Exercises">
        {a.exercises.map((e, i) => {
          const f = e.completed ? 1 : e.sets.length ? e.sets.filter((s) => s.done).length / e.sets.length : 0;
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === a.currentIndex}
              aria-label={`${getExercise(e.exercise_id).name}${e.completed ? ', done' : e.skipped ? ', skipped' : ''}`}
              onClick={() => dispatch({ type: 'setCurrent', index: i })}
              className="flex h-11 flex-1 items-center"
            >
              <span className={cx('relative block h-1.5 w-full overflow-hidden rounded-full', e.skipped ? 'bg-dim/40' : 'bg-line', i === a.currentIndex && 'ring-1 ring-ink/60 ring-offset-1 ring-offset-bg')}>
                <span className="absolute inset-y-0 left-0 rounded-full bg-lime transition-[width] duration-300" style={{ width: `${f * 100}%` }} />
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

function metaLine(log: ExerciseLog): string {
  const ex = getExercise(log.exercise_id);
  const mode = modeOf(ex);
  if (mode === 'weights') {
    const w = log.sets[0]?.weight_kg;
    return `${log.sets.length} × ${ex.default_reps ?? 10}${w ? ` · ${fmtKg(w)} kg` : ''}`;
  }
  if (mode === 'bodyweight') return `${log.sets.length} × ${ex.default_reps ?? 10}`;
  if (mode === 'timedSets') return `${log.sets.length} × ${ex.duration_seconds}s hold`;
  if (mode === 'check') return `${ex.target_distance_m} m`;
  const s = ex.duration_seconds ?? 45;
  return s >= 120 ? `${Math.round(s / 60)} min` : `${s} s`;
}

function CollapsedRow({ log, i }: { log: ExerciseLog; i: number }) {
  const { dispatch } = useStore();
  const ex = getExercise(log.exercise_id);
  const color = CATEGORY_HEX[ex.category];
  const done = log.completed;
  const partial = !done && log.sets.some((s) => s.done);
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'setCurrent', index: i })}
      className={cx('press flex min-h-[60px] w-full items-center gap-3.5 rounded-[18px] px-3.5 text-left', done ? 'bg-surf/70' : 'bg-surf')}
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2"
        style={{ borderColor: done ? color : log.skipped ? HEX.dim : partial ? HEX.lime : HEX.dim, background: done ? color : 'transparent' }}
        aria-hidden
      >
        {done ? <Check size={18} strokeWidth={3} className="text-onlime" /> : log.skipped ? <SkipForward size={14} className="text-dim" /> : <span className="text-xs font-bold text-muted">{i + 1}</span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cx('block truncate text-[15px] font-semibold', (done || log.skipped) && 'text-muted', log.skipped && 'line-through')}>{ex.name}</span>
        <span className="block text-xs text-dim">
          {metaLine(log)}
          {partial ? ` · ${log.sets.filter((s) => s.done).length} of ${log.sets.length} sets` : ''}
          {log.skipped ? ' · skipped' : ''}
        </span>
      </span>
      <ChevronDown size={20} className="shrink-0 text-dim" aria-hidden />
    </button>
  );
}

function ExerciseCard({ log, i, total }: { log: ExerciseLog; i: number; total: number }) {
  const { state, dispatch } = useStore();
  const nav = useNav();
  const ex = getExercise(log.exercise_id);
  const mode = modeOf(ex);
  const CatIcon = CATEGORY_ICON[ex.category];
  const machine = settingsFor(state, ex.id).machine;
  const catChip = { strength: 'bg-strength/15 text-strength', stretch: 'bg-stretch/15 text-stretch', swim: 'bg-swim/15 text-swim', recovery: 'bg-heat/15 text-heat' }[ex.category];
  return (
    <section className="anim-rise flex flex-col gap-3 rounded-3xl border border-line bg-surf2 p-4" aria-label={ex.name}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-2">
          <Chip className="bg-muted/10 text-muted tabular">
            {i + 1} / {total}
          </Chip>
          <Chip className={catChip} icon={CatIcon}>
            {ex.equipment}
          </Chip>
        </div>
        <button
          type="button"
          onClick={() => nav.open({ kind: 'howto', id: ex.id })}
          className="press flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-lime/[0.12] pl-3 pr-3.5 text-[13px] font-semibold text-lime"
        >
          <BookOpen size={16} aria-hidden /> How to
        </button>
      </div>
      <div>
        <h2 className="font-display text-[34px] font-bold leading-[1.02]">{ex.name}</h2>
        <p className="mt-1 text-sm text-muted">{ex.target_muscle}</p>
      </div>
      {machine.length > 0 && (
        <p className="text-sm">
          <span className="text-muted">Your settings: </span>
          <span className="font-semibold">{machine.map((m) => `${m.label} ${m.value}`).join(' · ')}</span>
        </p>
      )}
      <div className="flex gap-2.5 rounded-2xl bg-bg/60 p-3 text-[13px] leading-[19px]">
        <Info size={18} className="mt-px shrink-0 text-muted" aria-hidden />
        <p>{ex.cues}</p>
      </div>

      {(mode === 'weights' || mode === 'bodyweight') && <SetsBlock log={log} i={i} />}
      {mode === 'timedSets' && <TimedSets log={log} i={i} />}
      {mode === 'timer' && <SingleTimer log={log} i={i} />}
      {mode === 'check' && <CheckPhase log={log} i={i} />}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {(mode === 'weights' || mode === 'bodyweight' || mode === 'timedSets') && (
          <div className="flex gap-1">
            <button type="button" onClick={() => dispatch({ type: 'addSet', ex: i })} className="press flex min-h-12 items-center gap-1 rounded-xl px-3 text-sm font-medium text-muted">
              <Plus size={16} aria-hidden /> Add set
            </button>
            {log.sets.length > 1 && !log.sets[log.sets.length - 1].done && (
              <button type="button" onClick={() => dispatch({ type: 'removeSet', ex: i })} className="press flex min-h-12 items-center gap-1 rounded-xl px-3 text-sm font-medium text-muted">
                <Minus size={16} aria-hidden /> Remove
              </button>
            )}
          </div>
        )}
        {!log.completed && (
          <button type="button" onClick={() => dispatch({ type: 'skip', ex: i })} className="press ml-auto flex min-h-12 items-center gap-1 rounded-xl px-3 text-sm font-medium text-muted">
            <SkipForward size={16} aria-hidden /> {log.skipped ? 'Unskip' : 'Skip for today'}
          </button>
        )}
      </div>
    </section>
  );
}

// ---------- weights / bodyweight ----------
function LastTime({ id }: { id: string }) {
  const { state } = useStore();
  const last = lastPerformance(state.sessions, id);
  const sug = suggestWeight(id, last, weightStepFor(state, id));
  if (!last || !last.sets.length)
    return <p className="rounded-2xl bg-bg/60 px-3 py-2.5 text-[13px] text-muted">First time on this one. Start light and find your weight.</p>;
  const weighted = last.sets.some((s) => s.weight_kg != null);
  // "40 kg × 10 · 10 · 10" (grouped by weight)
  const groups: { w: number | null; reps: (number | null)[] }[] = [];
  for (const s of last.sets) {
    const g = groups[groups.length - 1];
    if (g && g.w === s.weight_kg) g.reps.push(s.reps);
    else groups.push({ w: s.weight_kg, reps: [s.reps] });
  }
  const text = groups.map((g) => `${weighted ? `${fmtKg(g.w)} kg × ` : ''}${g.reps.join(' · ')}${weighted ? '' : ' reps'}`).join('  ·  ');
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-bg/60 p-3">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
        <HistoryIcon size={16} aria-hidden /> Last time · {parseLocal(last.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
      </p>
      <p className="font-display text-2xl font-semibold tabular">{text}</p>
      {sug?.up && (
        <Chip className="self-start bg-done/15 text-done" icon={TrendingUp}>
          All reps hit. Try {fmtKg(sug.weight)} kg today
        </Chip>
      )}
    </div>
  );
}

function SetsBlock({ log, i }: { log: ExerciseLog; i: number }) {
  const { state, dispatch } = useStore();
  const ex = getExercise(log.exercise_id);
  const weighted = modeOf(ex) === 'weights';
  const step = weightStepFor(state, ex.id);
  const activeIdx = log.sets.findIndex((s) => !s.done);
  const last = lastPerformance(state.sessions, ex.id);
  // A brushed thumb shouldn't silently un-log a set: first tap arms, second tap edits.
  const [armed, setArmed] = useState<number | null>(null);
  useEffect(() => {
    if (armed == null) return;
    const t = window.setTimeout(() => setArmed(null), 3000);
    return () => window.clearTimeout(t);
  }, [armed]);
  return (
    <>
      <LastTime id={ex.id} />
      <div className="flex flex-col gap-2">
        {log.sets.map((s, j) => {
          if (s.done)
            return (
              <button
                key={j}
                type="button"
                onClick={() => {
                  if (armed === j) {
                    setArmed(null);
                    dispatch({ type: 'undoSet', ex: i, set: j });
                  } else setArmed(j);
                }}
                aria-label={`Set ${j + 1} done: ${weighted ? `${fmtKg(s.weight_kg)} kilograms, ` : ''}${s.reps} reps. Tap twice to edit.`}
                className={cx('press flex h-12 items-center gap-3 rounded-2xl pl-3.5 pr-3 text-left', armed === j ? 'bg-heat/15 ring-1 ring-heat' : 'bg-done/[0.08]')}
              >
                <span className="w-12 text-xs font-semibold tracking-[0.04em] text-muted">SET {j + 1}</span>
                <span className="flex-1 text-base font-semibold tabular">
                  {armed === j ? <span className="text-sm text-heat">Tap again to edit this set</span> : weighted ? `${fmtKg(s.weight_kg)} kg × ${s.reps}` : `${s.reps} reps`}
                </span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-done">
                  <Check size={16} strokeWidth={3} className="text-onlime" aria-hidden />
                </span>
              </button>
            );
          if (j === activeIdx)
            return (
              <ActiveSet key={j} set={s} j={j} total={log.sets.length} weighted={weighted} step={step} prev={last?.sets[j] ?? null} onChange={(patch) => dispatch({ type: 'updateSet', ex: i, set: j, patch })} onLog={() => {
                unlockAudio();
                tapFeedback();
                dispatch({ type: 'logSet', ex: i, set: j, now: Date.now() });
              }} />
            );
          return (
            <div key={j} className="flex h-12 items-center gap-3 rounded-2xl border border-dashed border-line pl-3.5 pr-3 text-dim">
              <span className="w-12 text-xs font-semibold tracking-[0.04em]">SET {j + 1}</span>
              <span className="text-[15px] tabular">{weighted ? `${fmtKg(s.weight_kg)} kg × ${s.reps}` : `${s.reps} reps`}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-dim">
        Rest {restFor(state, ex.id)} s{weighted ? ` · steps of ${fmtKg(step)} kg` : ''} · change in How to
      </p>
    </>
  );
}

function ActiveSet({ set, j, total, weighted, step, prev, onChange, onLog }: { set: SetLog; j: number; total: number; weighted: boolean; step: number; prev: SetLog | null; onChange: (p: Partial<SetLog>) => void; onLog: () => void }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[20px] border-[1.5px] border-lime/60 bg-surf p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-[0.06em] text-lime">
          SET {j + 1} OF {total}
        </span>
        {prev && <span className="text-[13px] text-muted tabular">Prev {weighted ? `${fmtKg(prev.weight_kg)} × ${prev.reps}` : `${prev.reps} reps`}</span>}
      </div>
      <div className="flex flex-col gap-3">
        {weighted && (
          <Stepper label="Weight · kg" value={set.weight_kg ?? 0} step={step} decimals onChange={(v) => onChange({ weight_kg: v })} />
        )}
        <Stepper label="Reps" value={set.reps ?? 0} step={1} onChange={(v) => onChange({ reps: v })} />
      </div>
      <Btn variant="primary" onClick={onLog} disabled={(set.reps ?? 0) <= 0 || (weighted && (set.weight_kg ?? 0) <= 0)}>
        <Check size={22} strokeWidth={3} aria-hidden /> Log set {j + 1}
      </Btn>
      {weighted && (set.weight_kg ?? 0) <= 0 && <p className="-mt-1.5 text-center text-xs text-muted">Set the weight on the pin first. Tap the number to type it.</p>}
    </div>
  );
}

function Stepper({ label, value, step, decimals, onChange }: { label: string; value: number; step: number; decimals?: boolean; onChange: (v: number) => void }) {
  const [text, setText] = useState(fmtKg(value));
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setText(fmtKg(value));
  }, [value, editing]);
  const set = (v: number) => {
    const rounded = decimals ? Math.round(v * 100) / 100 : Math.round(v);
    const clean = Math.max(0, Math.min(decimals ? 500 : 200, rounded));
    onChange(clean);
    return clean;
  };
  const id = `stepper-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
        {label}
      </label>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <IconBtn label={`Decrease ${label}`} className="h-14 w-14 rounded-2xl bg-line" onClick={() => { tapFeedback(); set(value - step); }}>
          <Minus size={22} strokeWidth={2.5} aria-hidden />
        </IconBtn>
        <input
          id={id}
          inputMode={decimals ? 'decimal' : 'numeric'}
          value={text}
          onFocus={(e) => {
            setEditing(true);
            e.currentTarget.select();
          }}
          onChange={(e) => setText(e.target.value.replace(',', '.'))}
          onBlur={() => {
            setEditing(false);
            const v = parseFloat(text);
            setText(fmtKg(Number.isFinite(v) ? set(v) : value));
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className={cx('h-14 w-full min-w-0 rounded-xl bg-transparent text-center font-display font-bold tabular outline-none focus:bg-bg/60', text.length > 5 ? 'text-[28px]' : 'text-[38px]')}
        />
        <IconBtn label={`Increase ${label}`} className="h-14 w-14 rounded-2xl bg-line" onClick={() => { tapFeedback(); set(value + step); }}>
          <Plus size={22} strokeWidth={2.5} aria-hidden />
        </IconBtn>
      </div>
    </div>
  );
}

// ---------- timers ----------
function useCountdown(key: string, totalMs: number) {
  const { state, dispatch } = useStore();
  const nav = useNav();
  const t = state.active!.timers[key];
  const rem = t ? remainingMs(t, nav.now) : totalMs;
  const running = !!t && t.endsAt != null;
  return {
    rem,
    running,
    started: !!t,
    progress: 1 - rem / totalMs,
    start: () => {
      unlockAudio();
      tapFeedback();
      dispatch({ type: 'timerStart', key, totalMs, now: Date.now() });
    },
    pause: () => dispatch({ type: 'timerPause', key, now: Date.now() }),
    reset: () => dispatch({ type: 'timerReset', key }),
  };
}

function TimerFace({ rem, progress, color, size = 132, children }: { rem: number; progress: number; color: string; size?: number; children?: ReactNode }) {
  return (
    <Ring size={size} progress={progress} color={color} stroke={7} label={`${fmtClock(rem)} left`}>
      <span className="font-display text-[40px] font-bold leading-none tabular">{fmtClock(rem)}</span>
      {children}
    </Ring>
  );
}

function SingleTimer({ log, i }: { log: ExerciseLog; i: number }) {
  const { dispatch } = useStore();
  const ex = getExercise(log.exercise_id);
  const total = (ex.duration_seconds ?? 45) * 1000;
  const c = useCountdown(String(i), total);
  const color = CATEGORY_HEX[ex.category];
  const heat = ex.category === 'recovery';
  const sided = /each side|switch sides/i.test(ex.cues) || ['hip_flexor_stretch', 'pigeon_pose', 'thoracic_twist'].includes(ex.id);
  if (log.completed)
    return (
      <div className="flex items-center justify-between rounded-2xl bg-done/[0.08] p-3.5">
        <span className="flex items-center gap-2 font-semibold text-done">
          <Check size={20} strokeWidth={3} aria-hidden /> Done
        </span>
        <button type="button" onClick={() => dispatch({ type: 'toggleComplete', ex: i })} className="press min-h-12 px-3 text-sm font-medium text-muted">
          Undo
        </button>
      </div>
    );
  return (
    <div className="flex flex-col items-center gap-4 pt-1">
      <TimerFace rem={c.rem} progress={c.started ? c.progress : 0} color={color}>
        <span className="mt-1 text-[11px] text-muted">{c.running ? 'running' : c.started ? 'paused' : heat ? 'min' : 'hold'}</span>
      </TimerFace>
      {sided && <p className="-mt-1 text-[13px] text-muted">Do it once per side. Restart the timer for the second side.</p>}
      {heat && (
        <div className="flex flex-wrap justify-center gap-2">
          <Chip className="bg-swim/15 text-swim" icon={Droplet}>
            Drink water first
          </Chip>
          <Chip className="bg-heat/15 text-heat">Step out if dizzy</Chip>
        </div>
      )}
      <div className="grid w-full grid-cols-[1fr_auto] gap-2.5">
        {c.running ? (
          <Btn variant="secondary" onClick={c.pause}>
            <Pause size={20} fill="currentColor" aria-hidden /> Pause
          </Btn>
        ) : (
          <Btn variant="primary" className={heat ? '!bg-heat' : ex.category === 'stretch' ? '!bg-stretch' : ''} onClick={c.start}>
            <Play size={20} fill="currentColor" aria-hidden /> {c.started ? 'Resume' : `Start ${fmtClock(total)}`}
          </Btn>
        )}
        <IconBtn label="Reset timer" className="h-14 w-14 rounded-2xl bg-line" onClick={c.reset}>
          <RotateCcw size={20} aria-hidden />
        </IconBtn>
      </div>
      <button type="button" onClick={() => { tapFeedback(); dispatch({ type: 'toggleComplete', ex: i }); }} className="press -mt-1 min-h-12 px-3 text-sm font-semibold text-muted underline underline-offset-4">
        Mark done without timer
      </button>
    </div>
  );
}

function TimedSets({ log, i }: { log: ExerciseLog; i: number }) {
  const activeIdx = log.sets.findIndex((s) => !s.done);
  return (
    <div className="flex flex-col gap-2">
      {log.sets.map((s, j) =>
        s.done ? (
          <div key={j} className="flex h-12 items-center gap-3 rounded-2xl bg-done/[0.08] pl-3.5 pr-3">
            <span className="w-12 text-xs font-semibold tracking-[0.04em] text-muted">SET {j + 1}</span>
            <span className="flex-1 font-semibold tabular">{s.duration_s} s hold</span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-done">
              <Check size={16} strokeWidth={3} className="text-onlime" aria-hidden />
            </span>
          </div>
        ) : j === activeIdx ? (
          <TimedSetActive key={j} i={i} j={j} s={s} total={log.sets.length} />
        ) : (
          <div key={j} className="flex h-12 items-center gap-3 rounded-2xl border border-dashed border-line pl-3.5 text-dim">
            <span className="w-12 text-xs font-semibold tracking-[0.04em]">SET {j + 1}</span>
            <span className="text-[15px] tabular">{s.duration_s} s hold</span>
          </div>
        ),
      )}
    </div>
  );
}

function TimedSetActive({ i, j, s, total }: { i: number; j: number; s: SetLog; total: number }) {
  const { dispatch } = useStore();
  const c = useCountdown(`${i}:${j}`, (s.duration_s ?? 45) * 1000);
  return (
    <div className="flex flex-col items-center gap-3.5 rounded-[20px] border-[1.5px] border-lime/60 bg-surf p-4">
      <span className="self-start text-xs font-bold tracking-[0.06em] text-lime">
        SET {j + 1} OF {total}
      </span>
      <TimerFace rem={c.rem} progress={c.started ? c.progress : 0} color={HEX.lime} size={120} />
      <div className="grid w-full grid-cols-2 gap-2.5">
        {c.running ? (
          <Btn variant="secondary" onClick={c.pause}>
            <Pause size={20} fill="currentColor" aria-hidden /> Pause
          </Btn>
        ) : (
          <Btn variant="primary" onClick={c.start}>
            <Play size={20} fill="currentColor" aria-hidden /> {c.started ? 'Resume' : 'Start'}
          </Btn>
        )}
        <Btn variant="secondary" onClick={() => { tapFeedback(); dispatch({ type: 'timerReset', key: `${i}:${j}` }); dispatch({ type: 'logSet', ex: i, set: j, now: Date.now() }); }}>
          <Check size={20} strokeWidth={3} aria-hidden /> Done
        </Btn>
      </div>
    </div>
  );
}

function CheckPhase({ log, i }: { log: ExerciseLog; i: number }) {
  const { dispatch } = useStore();
  const ex = getExercise(log.exercise_id);
  if (log.completed)
    return (
      <div className="flex items-center justify-between rounded-2xl bg-swim/[0.08] p-3.5">
        <span className="flex items-center gap-2 font-semibold text-swim">
          <Check size={20} strokeWidth={3} aria-hidden /> {ex.target_distance_m} m done
        </span>
        <button type="button" onClick={() => dispatch({ type: 'toggleComplete', ex: i })} className="press min-h-12 px-3 text-sm font-medium text-muted">
          Undo
        </button>
      </div>
    );
  return (
    <>
      <p className="font-display text-[26px] font-semibold text-swim">
        {ex.target_distance_m} m · {(ex.target_distance_m ?? 0) / 25} lengths
      </p>
      <Btn variant="swim" onClick={() => { tapFeedback(); dispatch({ type: 'toggleComplete', ex: i }); }}>
        <Check size={22} strokeWidth={3} aria-hidden /> Mark phase done
      </Btn>
    </>
  );
}

// ---------- rest ----------
function RestBar() {
  const { state, dispatch } = useStore();
  const nav = useNav();
  const rest = state.active!.rest!;
  const rem = remainingMs(rest, nav.now);
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(16px,env(safe-area-inset-bottom))]" role="timer" aria-live="off" aria-label={`Rest ${fmtClock(rem)} left`}>
      <div className="anim-rise mx-auto flex h-[76px] max-w-[448px] items-center gap-3 rounded-[22px] border border-line bg-[#232E3B] pl-3.5 pr-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
        <Ring size={52} progress={1 - rem / rest.totalMs} color={HEX.lime}>
          <span className="font-display text-[22px] font-bold tabular">{Math.ceil(rem / 1000)}</span>
        </Ring>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">Rest</p>
          <p className="truncate text-xs text-muted">{rest.label}</p>
        </div>
        <Btn variant="secondary" size="sm" className="px-3.5 text-[15px] font-semibold" onClick={() => dispatch({ type: 'restAdd', ms: 30_000, now: Date.now() })}>
          +30s
        </Btn>
        <Btn variant="ghost" size="sm" className="px-3.5 text-[15px] font-semibold" onClick={() => dispatch({ type: 'restSkip' })}>
          Skip
        </Btn>
      </div>
    </div>
  );
}
