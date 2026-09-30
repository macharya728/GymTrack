import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { useNav } from '../App';
import { useStore } from '../lib/store';
import { ROUTINES, estimateMinutes, getExercise, modeOf, routineCategory, routineNumber } from '../data/catalog';
import { Btn, CATEGORY_ICON, IconTile, cx } from '../components/ui';
import type { Routine } from '../types';

function exMeta(id: string) {
  const e = getExercise(id);
  const m = modeOf(e);
  if (m === 'weights' || m === 'bodyweight') return `${e.default_sets} × ${e.default_reps}`;
  if (m === 'timedSets') return `${e.default_sets} × ${e.duration_seconds}s`;
  if (m === 'check') return `${e.target_distance_m} m`;
  const s = e.duration_seconds ?? 45;
  return s >= 120 ? `${Math.round(s / 60)} min` : `${s} s`;
}

export default function Queue() {
  const { state } = useStore();
  const [open, setOpen] = useState<string | null>(ROUTINES[state.queueIndex].id);
  return (
    <div className="pt-safe">
      <header className="px-4 pb-3 pt-4">
        <h1 className="font-display text-[32px] font-bold leading-none">Queue</h1>
        <p className="mt-1 text-sm text-muted">Six workouts in a loop. Miss a day and the next one just waits.</p>
      </header>
      <main className="flex flex-col gap-2.5 px-4 pb-4">
        {ROUTINES.map((r) => (
          <RoutineCard key={r.id} r={r} open={open === r.id} toggle={() => setOpen(open === r.id ? null : r.id)} />
        ))}
      </main>
    </div>
  );
}

function RoutineCard({ r, open, toggle }: { r: Routine; open: boolean; toggle: () => void }) {
  const { state } = useStore();
  const nav = useNav();
  const isNext = ROUTINES[state.queueIndex].id === r.id;
  const doneCount = state.sessions.filter((s) => s.routine_id === r.id).length;
  return (
    <section className={cx('overflow-hidden rounded-[20px] border', isNext ? 'border-lime/40 bg-surf2' : 'border-transparent bg-surf')}>
      <button type="button" onClick={toggle} aria-expanded={open} className="press flex min-h-[76px] w-full items-center gap-3.5 p-3 text-left">
        <IconTile category={routineCategory(r)} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
            Workout {routineNumber(r.id)}
            {isNext && <span className="rounded-full bg-lime/15 px-2 py-0.5 text-lime">Up next</span>}
          </span>
          <span className="block text-[15px] font-semibold leading-snug">{r.title}</span>
          <span className="block text-xs text-muted">
            ~{estimateMinutes(r.exercises)} min · done {doneCount}×
          </span>
        </span>
        <ChevronDown size={20} className={cx('shrink-0 text-dim transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="flex flex-col gap-1 px-3 pb-3">
          <p className="px-1 pb-2 text-[13px] leading-[19px] text-muted">{r.subtitle}</p>
          {r.exercises.map((id) => {
            const e = getExercise(id);
            const Icon = CATEGORY_ICON[e.category];
            const express = r.express_exercise_ids.includes(id);
            return (
              <button key={id} type="button" onClick={() => nav.open({ kind: 'howto', id })} className="press flex min-h-14 items-center gap-3 rounded-xl px-2 text-left">
                <Icon size={18} className="shrink-0 text-muted" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{e.name}</span>
                  <span className="block text-xs text-dim">
                    {exMeta(id)}
                    {express ? ' · in Express' : ''}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-lime">
                  <BookOpen size={14} aria-hidden /> How to
                </span>
              </button>
            );
          })}
          {!state.active && (
            <Btn
              variant={isNext ? 'primary' : 'secondary'}
              className="mt-2"
              onClick={() => {
                nav.setPick(isNext ? null : r.id);
                nav.setTab('today');
              }}
            >
              {isNext ? 'Go to check-in' : 'Do this one today'} <ChevronRight size={18} aria-hidden />
            </Btn>
          )}
        </div>
      )}
    </section>
  );
}
