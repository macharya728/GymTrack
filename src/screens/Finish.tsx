import { useState } from 'react';
import { BatteryFull, BatteryLow, BatteryMedium, Check, ChevronRight, Trash2 } from 'lucide-react';
import { useNav } from '../App';
import { useStore } from '../lib/store';
import { ROUTINES, getExercise, getRoutine, routineCategory, routineNumber } from '../data/catalog';
import { nextQueueIndex, sessionRatio, volumeKg } from '../lib/logic';
import { Btn, HEX, IconTile, Ring, Sheet, cx } from '../components/ui';
import { tapFeedback } from '../lib/device';
import type { Energy } from '../types';

export default function Finish() {
  const { state, dispatch } = useStore();
  const nav = useNav();
  const a = state.active!;
  const r = getRoutine(a.routine_id);
  const ratio = sessionRatio(a.exercises);
  const done = a.exercises.filter((e) => e.completed).length;
  const vol = volumeKg(a.exercises);
  const mins = Math.max(1, Math.round((nav.now - Date.parse(a.checked_in_at)) / 60000));
  const [energy, setEnergy] = useState<Energy | null>(null);
  const next = ROUTINES[nextQueueIndex(state.queueIndex, a.routine_id)];

  const save = () => {
    tapFeedback();
    dispatch({ type: 'finish', energy, now: Date.now() });
    nav.toast(energy === 'low' ? 'Saved. Express will be on next time.' : 'Workout saved');
  };

  const opts: [Energy, string, typeof BatteryFull, string][] = [
    ['high', 'High', BatteryFull, 'text-done'],
    ['moderate', 'Moderate', BatteryMedium, 'text-heat'],
    ['low', 'Low', BatteryLow, 'text-muted'],
  ];

  return (
    <div className="flex min-h-dvh flex-col pt-safe">
      <main className="flex flex-1 flex-col items-center gap-5 px-4 pb-6 pt-10">
        <Ring size={104} progress={Math.max(ratio, 0.02)} color={ratio >= 0.999 ? HEX.done : HEX.lime} stroke={6} label={`${Math.round(ratio * 100)} percent done`}>
          {ratio >= 0.999 ? <Check size={44} strokeWidth={3} className="text-done" aria-hidden /> : <span className="font-display text-3xl font-bold tabular">{Math.round(ratio * 100)}%</span>}
        </Ring>
        <div className="text-center">
          <h1 className="font-display text-[40px] font-bold leading-none">{ratio >= 0.999 ? `Workout ${routineNumber(r.id)} done` : 'You showed up'}</h1>
          <p className="mt-1.5 text-[15px] text-muted">
            {r.title}
            {a.is_express ? ' · Express' : ''}
          </p>
        </div>
        <div className="grid w-full grid-cols-3 gap-2.5">
          <Stat v={String(mins)} l={mins === 1 ? "minute" : "minutes"} />
          <Stat v={`${done}/${a.exercises.length}`} l="exercises" />
          {vol > 0 ? <Stat v={vol.toLocaleString('en-US')} l="kg lifted" /> : <Stat v={swimMeters(a.exercises)} l="m swum" />}
        </div>

        <section className="flex w-full flex-col gap-3 pt-2" aria-label="Energy">
          <div><h2 className="text-[17px] font-semibold">How&rsquo;s your energy?</h2><p className="mt-0.5 text-[13px] text-muted">Low turns on Express for next time.</p></div>
          <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Energy rating">
            {opts.map(([k, label, Icon, color]) => {
              const on = energy === k;
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    tapFeedback();
                    setEnergy(on ? null : k);
                  }}
                  className={cx('press flex h-[104px] flex-col items-center justify-center gap-2 rounded-[18px] border', on ? 'border-2 border-lime bg-lime/10' : 'border-line bg-surf')}
                >
                  <Icon size={32} className={color} aria-hidden />
                  <span className={cx('text-[15px] font-semibold', on && 'text-lime')}>{label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[13px] leading-[19px] text-muted">Pick Low and your next check-in opens with Express switched on.</p>
        </section>

        <div className="flex w-full items-center gap-3 rounded-[18px] bg-surf p-3.5">
          <IconTile category={routineCategory(next)} size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">Up next · whenever you&rsquo;re back</p>
            <p className="truncate text-[15px] font-semibold">
              Workout {routineNumber(next.id)} · {next.title}
            </p>
          </div>
          <ChevronRight size={20} className="text-dim" aria-hidden />
        </div>

        <div className="flex-1" />
        <Btn variant="primary" size="lg" className="w-full" onClick={save}>
          Save &amp; finish
        </Btn>
        <div className="flex w-full justify-between">
          <button type="button" onClick={nav.back} className="press min-h-12 px-2 text-sm font-medium text-muted">
            Back to workout
          </button>
          <button type="button" onClick={() => nav.open({ kind: 'sheet', id: 'discard' })} className="press flex min-h-12 items-center gap-1.5 px-2 text-sm font-medium text-warn">
            <Trash2 size={16} aria-hidden /> Discard
          </button>
        </div>
      </main>

      {nav.sheetOpen('discard') && (
        <Sheet onClose={nav.back} label="Discard workout?">
          <h2 className="font-display text-[28px] font-bold">Discard this workout?</h2>
          <p className="mt-2 text-[15px] leading-6 text-muted">Nothing from this session will be saved and the queue won&rsquo;t move. Use this if you checked in by mistake.</p>
          <div className="mt-5 flex flex-col gap-2.5">
            <Btn
              variant="danger"
              onClick={() => {
                dispatch({ type: 'discard' });
                nav.toast('Workout discarded');
              }}
            >
              <Trash2 size={18} aria-hidden /> Discard workout
            </Btn>
            <Btn variant="secondary" onClick={nav.back}>
              Keep it
            </Btn>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function swimMeters(exs: { exercise_id: string; completed: boolean }[]) {
  return String(exs.reduce((m, e) => m + (e.completed ? getExercise(e.exercise_id).target_distance_m ?? 0 : 0), 0));
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-2xl bg-surf px-3 py-3.5">
      <span className="font-display text-[30px] font-bold leading-none tabular">{v}</span>
      <span className="text-xs text-muted">{l}</span>
    </div>
  );
}
