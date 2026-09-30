import { useEffect, useState } from 'react';
import { Check, ChevronRight, Flame, Play, Timer, WifiOff, Zap, Activity, Dumbbell, Waves } from 'lucide-react';
import { useNav } from '../App';
import { useStore } from '../lib/store';
import { ROUTINES, estimateMinutes, getExercise, getRoutine, isSwimRoutine, routineNumber, routineSummary, shortName } from '../data/catalog';
import { isoWeek, localDate, parseLocal, sessionRatio, weekDates } from '../lib/logic';
import { fmtElapsed, useOfflineReady, useOnline } from '../lib/hooks';
import { requestPersistentStorage, tapFeedback, unlockAudio } from '../lib/device';
import { Btn, Chip, HEX, Ring, cx } from '../components/ui';
import type { Routine } from '../types';

export default function Home() {
  const { state, dispatch } = useStore();
  const nav = useNav();
  const today = new Date(nav.now);
  const a = state.active;
  const queued = ROUTINES[state.queueIndex];
  const routine = nav.pick ? getRoutine(nav.pick) : queued;
  const swapped = routine.id !== queued.id;
  const [express, setExpress] = useState(state.preferExpressNext);
  useEffect(() => setExpress(state.preferExpressNext), [state.preferExpressNext]);

  const checkIn = () => {
    unlockAudio();
    tapFeedback();
    void requestPersistentStorage();
    dispatch({ type: 'checkIn', routineId: routine.id, express, now: Date.now() });
    nav.setPick(null);
    nav.open({ kind: 'session' });
  };

  const last = state.sessions[state.sessions.length - 1];

  return (
    <div className="pt-safe">
      <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
        <div>
          <h1 className="font-display text-[32px] font-bold leading-none">GymTrack</h1>
          <p className="mt-1 text-sm text-muted">
            {today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · Week {isoWeek(today)}
          </p>
        </div>
        <OfflineChip />
      </header>

      <main className="flex flex-col gap-3.5 px-4">
        <WeekStrip />

        {a ? (
          <ResumeCard />
        ) : (
          <section className="flex flex-col gap-3 rounded-3xl border border-line bg-surf2 p-[18px]" aria-label="Up next">
            <div className="flex items-center justify-between gap-2">
              <Chip className={swapped ? 'bg-swim/15 text-swim' : 'bg-lime/15 text-lime tracking-[0.04em]'}>
                {swapped ? `SWAPPED IN · WORKOUT ${routineNumber(routine.id)}` : `UP NEXT · WORKOUT ${routineNumber(routine.id)}`}
              </Chip>
              {swapped ? (
                <button type="button" onClick={() => nav.setPick(null)} className="press -mr-2 min-h-12 px-2 text-sm font-medium text-muted underline underline-offset-4">
                  Back to Workout {routineNumber(queued.id)}
                </button>
              ) : (
                <span className="text-[13px] font-medium text-muted">
                  {routineNumber(routine.id)} of {ROUTINES.length}
                </span>
              )}
            </div>
            <h2 className="font-display text-[30px] font-bold leading-[1.05]">{routine.title}</h2>
            <p className="text-sm leading-5 text-muted">{routine.subtitle}</p>
            <MetaChips routine={routine} express={express} />
            <button
              type="button"
              role="switch"
              aria-checked={express}
              onClick={() => {
                tapFeedback();
                setExpress((v) => !v);
              }}
              className="press flex items-center gap-3 rounded-2xl bg-bg/55 py-2.5 pl-2.5 pr-3 text-left"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime/15 text-lime">
                <Zap size={20} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">15-min Express</span>
                <span className="block truncate text-[13px] text-muted">{routine.express_exercise_ids.map(shortName).join(' · ')}</span>
                {state.preferExpressNext && <span className="block text-xs text-heat">On because you logged low energy last time</span>}
              </span>
              <span className={cx('relative h-8 w-[52px] shrink-0 rounded-full border-2 transition-colors', express ? 'border-lime bg-lime' : 'border-dim')}>
                <span className={cx('absolute top-1/2 -translate-y-1/2 rounded-full transition-all', express ? 'left-[22px] h-6 w-6 bg-onlime' : 'left-1.5 h-4 w-4 bg-dim')} />
              </span>
            </button>
            <Btn variant="primary" size="lg" onClick={checkIn}>
              <Play size={22} fill="currentColor" aria-hidden />
              Check In &amp; Start
            </Btn>
          </section>
        )}

        {!a && <QuickSwap current={routine} />}

        {last && (
          <p className="px-1 pb-2 text-[13px] text-dim">
            Last: {parseLocal(last.date).toLocaleDateString('en-US', { weekday: 'short' })} · Workout {routineNumber(last.routine_id)} ·{' '}
            {Math.round((Date.parse(last.finished_at) - Date.parse(last.checked_in_at)) / 60000)} min
            {last.energy_rating ? ` · ${last.energy_rating} energy` : ''}
          </p>
        )}
      </main>
    </div>
  );
}

function OfflineChip() {
  const ready = useOfflineReady();
  const online = useOnline();
  if (!online)
    return (
      <Chip className="bg-heat/15 text-heat" icon={WifiOff}>
        {ready ? 'Offline · all saved' : 'Offline'}
      </Chip>
    );
  if (ready)
    return (
      <Chip className="bg-done/15 text-done" icon={Check}>
        Offline ready
      </Chip>
    );
  return null;
}

function MetaChips({ routine, express }: { routine: Routine; express: boolean }) {
  const ids = express ? routine.express_exercise_ids : routine.exercises;
  const exs = ids.map(getExercise);
  const n = (c: string) => exs.filter((e) => e.category === c).length;
  const swimM = exs.reduce((a, e) => a + (e.target_distance_m ?? 0), 0);
  const heat = exs.find((e) => e.category === 'recovery');
  return (
    <div className="flex flex-wrap gap-2">
      {n('strength') > 0 && <Chip className="bg-strength/15 text-strength" icon={Dumbbell}>{n('strength')} lifts</Chip>}
      {swimM > 0 && <Chip className="bg-swim/15 text-swim" icon={Waves}>{swimM} m swim</Chip>}
      {n('stretch') > 0 && <Chip className="bg-stretch/15 text-stretch" icon={Activity}>{n('stretch')} stretch{n('stretch') > 1 ? 'es' : ''}</Chip>}
      {heat && <Chip className="bg-heat/15 text-heat" icon={Flame}>{heat.id === 'sauna_session' ? 'Sauna' : 'Steam'} {Math.round((heat.duration_seconds ?? 0) / 60)} min</Chip>}
      <Chip className="bg-muted/10 text-muted" icon={Timer}>~{estimateMinutes(ids)} min</Chip>
    </div>
  );
}

function QuickSwap({ current }: { current: Routine }) {
  const nav = useNav();
  const swims = ROUTINES.filter(isSwimRoutine);
  return (
    <section className="flex flex-col gap-2.5" aria-label="Quick swap">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold">Swimming today instead?</h3>
        <button type="button" onClick={() => nav.open({ kind: 'swap' })} className="press -mr-2 flex min-h-12 items-center gap-0.5 px-2 text-sm font-medium text-lime">
          All workouts <ChevronRight size={16} aria-hidden />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {swims.map((r) => {
          const on = current.id === r.id;
          const s = routineSummary(r);
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={on}
              onClick={() => {
                tapFeedback();
                nav.setPick(r.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={cx('press flex min-h-[72px] items-center gap-3 rounded-[18px] border p-3.5 text-left', on ? 'border-swim bg-swim/15' : 'border-swim/30 bg-swim/[0.08]')}
            >
              {on ? <Check size={22} className="shrink-0 text-swim" aria-hidden /> : <Waves size={22} className="shrink-0 text-swim" aria-hidden />}
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{r.title.replace(' & Sauna', '')}</span>
                <span className="block text-xs text-muted">
                  W{routineNumber(r.id)} · {s.swimM} m + sauna
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ResumeCard() {
  const { state } = useStore();
  const nav = useNav();
  const a = state.active!;
  const r = getRoutine(a.routine_id);
  const ratio = sessionRatio(a.exercises);
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-lime/40 bg-surf2 p-[18px]" aria-label="Workout in progress">
      <div className="flex items-center gap-4">
        <Ring size={64} progress={ratio} color={HEX.lime} stroke={6} label={`${Math.round(ratio * 100)}% done`}>
          <span className="font-display text-xl font-bold tabular">{Math.round(ratio * 100)}%</span>
        </Ring>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-lime">
            In progress · Workout {routineNumber(r.id)}
            {a.is_express ? ' · Express' : ''}
          </p>
          <h2 className="font-display text-2xl font-bold leading-tight">{r.title}</h2>
          <p className="text-sm text-muted tabular">Started {fmtElapsed(nav.now - Date.parse(a.checked_in_at))} ago</p>
        </div>
      </div>
      <Btn variant="primary" size="lg" onClick={() => nav.open({ kind: 'session' })}>
        <Play size={22} fill="currentColor" aria-hidden /> Resume workout
      </Btn>
    </section>
  );
}

function WeekStrip() {
  const { state } = useStore();
  const nav = useNav();
  const todayS = localDate(new Date(nav.now));
  const days = weekDates(new Date(nav.now));
  const letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const count = state.sessions.filter((s) => days.includes(s.date)).length;
  return (
    <section className="flex flex-col gap-3 rounded-[20px] bg-surf px-4 py-3.5" aria-label="This week">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">This week</h3>
        <span className="text-[13px] text-muted">
          {count} session{count === 1 ? '' : 's'}
        </span>
      </div>
      <ol className="flex justify-between">
        {days.map((d, i) => {
          const fin = state.sessions.filter((s) => s.date === d);
          const live = state.active && state.active.date === d ? sessionRatio(state.active.exercises) : null;
          const ratio = Math.max(live ?? 0, ...fin.map((s) => s.completed_ratio), 0);
          const has = fin.length > 0 || live != null;
          const isToday = d === todayS;
          const past = d < todayS;
          const num = parseLocal(d).getDate();
          const full = ratio >= 0.999;
          let ring;
          if (has && full)
            ring = (
              <Ring size={40} progress={1} color={HEX.done}>
                <Check size={18} strokeWidth={3} className="text-done" aria-hidden />
              </Ring>
            );
          else if (has)
            ring = (
              <Ring size={40} progress={Math.max(ratio, 0.04)} color={HEX.lime} track={isToday ? '#3a4a1c' : HEX.line}>
                <Check size={16} strokeWidth={3} className="text-done" aria-hidden />
              </Ring>
            );
          else if (isToday)
            ring = (
              <Ring size={40} progress={0} color={HEX.lime} track={HEX.lime} stroke={2.5}>
                <span className="text-sm font-bold text-lime tabular">{num}</span>
              </Ring>
            );
          else
            ring = (
              <Ring size={40} progress={0} color={HEX.lime} track={past ? HEX.dim : HEX.line} dashed={past} stroke={2}>
                <span className={cx('text-[13px] font-medium tabular', past ? 'text-dim' : 'text-muted')}>{num}</span>
              </Ring>
            );
          const label = `${parseLocal(d).toLocaleDateString('en-US', { weekday: 'long' })}: ${has ? (full ? 'completed' : `${Math.round(ratio * 100)}% done`) : isToday ? 'today' : past ? 'rest day' : 'upcoming'}`;
          return (
            <li key={d} className="flex w-10 flex-col items-center gap-1.5" aria-label={label}>
              {ring}
              <span className={cx('text-xs', isToday ? 'font-bold text-lime' : has ? 'font-medium text-ink' : 'font-medium text-muted')} aria-hidden>
                {letters[i]}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
