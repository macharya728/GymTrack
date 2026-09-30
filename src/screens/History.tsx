import { useRef, useState } from 'react';
import { ChevronDown, Download, HardDrive, Trash2, Upload, Zap } from 'lucide-react';
import { useNav } from '../App';
import { useStore } from '../lib/store';
import { getExercise, getRoutine, modeOf, routineNumber } from '../data/catalog';
import { localDate, parseLocal, sanitize, volumeKg } from '../lib/logic';
import { fmtKg } from '../lib/hooks';
import { downloadBlob, exportBackup, importBackup } from '../lib/backup';
import { requestPersistentStorage } from '../lib/device';
import { Btn, Chip, HEX, Ring, SectionLabel, Sheet, cx } from '../components/ui';
import type { SessionLog } from '../types';

export default function History() {
  const { state } = useStore();
  const nav = useNav();
  const now = new Date(nav.now);
  const monthPrefix = localDate(now).slice(0, 7);
  const month = state.sessions.filter((s) => s.date.startsWith(monthPrefix));
  const swimM = month.reduce((a, s) => a + s.exercises.reduce((b, e) => b + (e.completed ? getExercise(e.exercise_id).target_distance_m ?? 0 : 0), 0), 0);
  const kg = month.reduce((a, s) => a + volumeKg(s.exercises), 0);
  const list = [...state.sessions].reverse();

  return (
    <div className="pt-safe">
      <header className="px-4 pb-3 pt-4">
        <h1 className="font-display text-[32px] font-bold leading-none">History</h1>
        <p className="mt-1 text-sm text-muted">{now.toLocaleDateString('en-US', { month: 'long' })} so far</p>
      </header>
      <main className="flex flex-col gap-3 px-4 pb-4">
        <div className="grid grid-cols-3 gap-2.5">
          <Stat v={String(month.length)} l={month.length === 1 ? 'session' : 'sessions'} />
          <Stat v={swimM.toLocaleString('en-US')} l="m swum" />
          <Stat v={kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : String(Math.round(kg))} l="kg lifted" />
        </div>

        <SectionLabel className="mt-2">Sessions</SectionLabel>
        {list.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-line p-6 text-center">
            <p className="font-semibold">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted">Finish your first workout and it shows up here.</p>
          </div>
        ) : (
          list.map((s) => <SessionRow key={s.session_id} s={s} />)
        )}

        <Backup />
      </main>
    </div>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-2xl bg-surf px-2 py-3.5">
      <span className="font-display text-[28px] font-bold leading-none tabular">{v}</span>
      <span className="text-xs text-muted">{l}</span>
    </div>
  );
}

function SessionRow({ s }: { s: SessionLog }) {
  const { dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const nav = useNav();
  const sheetId = `delete-${s.session_id}`;
  const r = getRoutine(s.routine_id);
  const mins = Math.max(1, Math.round((Date.parse(s.finished_at) - Date.parse(s.checked_in_at)) / 60000));
  const full = s.completed_ratio >= 0.999;
  return (
    <section className="overflow-hidden rounded-[18px] bg-surf">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="press flex min-h-[72px] w-full items-center gap-3 p-3 text-left">
        <Ring size={44} progress={Math.max(s.completed_ratio, 0.03)} color={full ? HEX.done : HEX.lime}>
          <span className="text-[11px] font-bold tabular">{Math.round(s.completed_ratio * 100)}%</span>
        </Ring>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-muted">
            {parseLocal(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {mins} min
            {s.energy_rating ? ` · ${s.energy_rating} energy` : ''}
          </span>
          <span className="block truncate text-[15px] font-semibold">
            W{routineNumber(r.id)} · {r.title}
          </span>
          <span className="mt-1 flex gap-1.5">
            {s.is_express && (
              <Chip className="bg-lime/15 px-2 py-0.5 text-lime" icon={Zap}>
                Express
              </Chip>
            )}
            {s.swapped && <Chip className="bg-swim/15 px-2 py-0.5 text-swim">Swapped in</Chip>}
          </span>
        </span>
        <ChevronDown size={20} className={cx('shrink-0 text-dim transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="flex flex-col gap-2 border-t border-line px-3.5 pb-3 pt-3">
          {s.exercises.map((e, i) => {
            const ex = getExercise(e.exercise_id);
            const m = modeOf(ex);
            const done = e.sets.filter((x) => x.done);
            let detail = e.completed ? 'done' : e.skipped ? 'skipped' : 'not done';
            if ((m === 'weights' || m === 'bodyweight') && done.length) detail = done.map((x) => (m === 'weights' ? `${fmtKg(x.weight_kg)}×${x.reps}` : `${x.reps}`)).join(', ');
            if (m === 'timedSets' && done.length) detail = `${done.length} × ${done[0].duration_s}s`;
            return (
              <div key={i} className="flex justify-between gap-3 text-sm">
                <span className={cx('min-w-0 truncate', !e.completed && !done.length && 'text-dim')}>{ex.name}</span>
                <span className="shrink-0 text-muted tabular">{detail}</span>
              </div>
            );
          })}
          <button type="button" onClick={() => nav.open({ kind: 'sheet', id: sheetId })} className="press mt-1 flex min-h-11 items-center gap-1.5 self-end px-1 text-sm font-medium text-warn">
            <Trash2 size={16} aria-hidden /> Delete entry
          </button>
        </div>
      )}
      {nav.sheetOpen(sheetId) && (
        <Sheet onClose={nav.back} label="Delete entry?">
          <h2 className="font-display text-[28px] font-bold">Delete this entry?</h2>
          <p className="mt-2 text-[15px] text-muted">It won&rsquo;t change your queue. This can&rsquo;t be undone.</p>
          <div className="mt-5 flex flex-col gap-2.5">
            <Btn
              variant="danger"
              onClick={() => {
                dispatch({ type: 'deleteSession', id: s.session_id });
                nav.back();
                nav.toast('Entry deleted');
              }}
            >
              <Trash2 size={18} aria-hidden /> Delete
            </Btn>
            <Btn variant="secondary" onClick={nav.back}>
              Keep it
            </Btn>
          </div>
        </Sheet>
      )}
    </section>
  );
}

function Backup() {
  const { state, dispatch } = useStore();
  const nav = useNav();
  const file = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const doExport = async () => {
    setBusy(true);
    try {
      const b = await exportBackup(state);
      downloadBlob(b, `gymtrack-backup-${localDate()}.json`);
      nav.toast('Backup downloaded');
    } finally {
      setBusy(false);
    }
  };
  const doImport = async (f: File | undefined) => {
    if (!f) return;
    setErr(null);
    setBusy(true);
    try {
      const raw = await importBackup(f);
      const clean = sanitize(raw);
      const dropped = raw.sessions.length - clean.sessions.length;
      dispatch({ type: 'replaceState', state: clean });
      nav.toast(`Restored ${clean.sessions.length} session${clean.sessions.length === 1 ? '' : 's'}${dropped > 0 ? `. Skipped ${dropped} from workouts that no longer exist.` : ''}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setBusy(false);
      if (file.current) file.current.value = '';
    }
  };

  return (
    <section className="mt-4 flex flex-col gap-3 rounded-[20px] bg-surf p-4" aria-label="Backup">
      <SectionLabel className="flex items-center gap-2">
        <HardDrive size={16} aria-hidden /> Your data
      </SectionLabel>
      <p className="text-[13px] leading-5 text-muted">
        Everything lives on this phone only: {state.sessions.length} session{state.sessions.length === 1 ? '' : 's'}, machine settings and photos. Download a backup now and then, and before changing phones.
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <Btn size="sm" variant="secondary" onClick={() => void doExport()} disabled={busy}>
          <Download size={18} aria-hidden /> Backup
        </Btn>
        <Btn size="sm" variant="secondary" onClick={() => file.current?.click()} disabled={busy}>
          <Upload size={18} aria-hidden /> Restore
        </Btn>
      </div>
      <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void doImport(e.target.files?.[0])} />
      {err && (
        <p className="text-sm text-warn" role="alert">
          {err}
        </p>
      )}
      <PersistStatus />
    </section>
  );
}

function PersistStatus() {
  const [status, setStatus] = useState<'unknown' | 'yes' | 'no'>('unknown');
  const check = async () => setStatus((await requestPersistentStorage()) ? 'yes' : 'no');
  if (status === 'unknown')
    return (
      <button type="button" onClick={() => void check()} className="press min-h-11 self-start px-1 text-sm font-medium text-lime">
        Check storage protection
      </button>
    );
  return (
    <p className={cx('text-xs', status === 'yes' ? 'text-done' : 'text-heat')}>
      {status === 'yes'
        ? 'Protected: the browser won’t clear this data on its own.'
        : 'Not protected yet. Install GymTrack to your home screen, then check again.'}
    </p>
  );
}
