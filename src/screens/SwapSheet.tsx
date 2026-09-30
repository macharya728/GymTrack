import { ChevronRight, Info, Waves } from 'lucide-react';
import { useNav } from '../App';
import { useStore } from '../lib/store';
import { ROUTINES, getRoutine, isSwimRoutine, routineCategory, routineNumber, routineSummary } from '../data/catalog';
import { IconTile, SectionLabel, Sheet, cx } from '../components/ui';
import { tapFeedback } from '../lib/device';
import type { Routine } from '../types';

function describe(r: Routine) {
  const s = routineSummary(r);
  const parts: string[] = [];
  if (s.swimM) parts.push(`${s.swimM} m`);
  if (s.strength) parts.push(`${s.strength} lifts`);
  if (s.stretch) parts.push(`${s.stretch} stretch${s.stretch > 1 ? 'es' : ''}`);
  if (s.heat) parts.push(`${s.heat.id === 'sauna_session' ? 'sauna' : 'steam'} ${Math.round((s.heat.duration_seconds ?? 0) / 60)} min`);
  return parts.join(' · ');
}

export default function SwapSheet() {
  const { state } = useStore();
  const nav = useNav();
  const queued = ROUTINES[state.queueIndex];
  const selected = nav.pick ?? queued.id;
  const choose = (id: string) => {
    tapFeedback();
    nav.setPick(id === queued.id ? null : id);
    nav.back();
  };
  const Row = ({ r }: { r: Routine }) => {
    const cat = routineCategory(r);
    const on = selected === r.id;
    return (
      <button
        type="button"
        onClick={() => choose(r.id)}
        aria-pressed={on}
        className={cx('press flex min-h-[76px] w-full items-center gap-3.5 rounded-[18px] p-3 text-left', on ? 'bg-lime/10 ring-2 ring-lime' : 'bg-surf2')}
      >
        <IconTile category={cat} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
            Workout {routineNumber(r.id)}
            {r.id === queued.id && <span className="rounded-full bg-lime/15 px-2 py-0.5 text-lime">Up next</span>}
          </span>
          <span className="block text-[15px] font-semibold leading-snug">{r.title}</span>
          <span className="block text-xs text-muted">{describe(r)}</span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-dim" aria-hidden />
      </button>
    );
  };
  const swims = ROUTINES.filter(isSwimRoutine);
  const others = ROUTINES.filter((r) => !isSwimRoutine(r));
  return (
    <Sheet onClose={nav.back} label="Swap today's workout">
      <h2 className="font-display text-[28px] font-bold">Swap today&rsquo;s workout</h2>
      <div className="mt-3 flex gap-2.5 rounded-2xl bg-lime/[0.08] p-3 text-[13px] leading-[18px]">
        <Info size={18} className="shrink-0 text-lime" aria-hidden />
        <p>
          Workout {routineNumber(queued.id)} stays next in your queue. Swapping never skips it.
        </p>
      </div>
      <SectionLabel className="mt-4 mb-2 flex items-center gap-1.5 text-swim">
        <Waves size={14} aria-hidden /> Swim
      </SectionLabel>
      <div className="flex flex-col gap-2.5">
        {swims.map((r) => (
          <Row key={r.id} r={r} />
        ))}
      </div>
      <SectionLabel className="mt-4 mb-2">Other workouts</SectionLabel>
      <div className="flex flex-col gap-2.5">
        {others.map((r) => (
          <Row key={r.id} r={getRoutine(r.id)} />
        ))}
      </div>
    </Sheet>
  );
}
