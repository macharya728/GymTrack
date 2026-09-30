import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, Camera, ExternalLink, Link2, PlayCircle, Plus, SlidersHorizontal, Trash2, WifiOff, X } from 'lucide-react';
import { useNav } from '../App';
import { useStore } from '../lib/store';
import { getExercise, modeOf, defaultRest, defaultWeightStep } from '../data/catalog';
import { TUTORIALS, TUTORIAL_HEADINGS, youtubeSearchUrl } from '../data/tutorials';
import { settingsFor } from '../lib/logic';
import { compressImage, deletePhoto, getPhoto, putPhoto } from '../lib/photos';
import { useOnline, fmtKg } from '../lib/hooks';
import { Btn, IconBtn, SectionLabel, Sheet, cx } from '../components/ui';
import type { MachineSetting } from '../types';

export default function HowTo({ id }: { id: string }) {
  const nav = useNav();
  const ex = getExercise(id);
  const tut = TUTORIALS[id];
  const [h1, h2] = TUTORIAL_HEADINGS[ex.category];
  const mode = modeOf(ex);
  const machineLike = ex.category === 'strength';
  const accent = { strength: 'text-strength', stretch: 'text-stretch', swim: 'text-swim', recovery: 'text-heat' }[ex.category];
  const dot = { strength: 'bg-strength/15 text-strength', stretch: 'bg-stretch/15 text-stretch', swim: 'bg-swim/15 text-swim', recovery: 'bg-heat/15 text-heat' }[ex.category];

  return (
    <div className="pt-safe pb-12">
      <header className="sticky top-0 z-10 flex items-center gap-1 bg-bg/95 py-1 pl-2 pr-4 backdrop-blur">
        <IconBtn label="Back" onClick={nav.back}>
          <ArrowLeft size={24} aria-hidden />
        </IconBtn>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">How to</p>
          <h1 className="truncate text-[17px] font-semibold">{ex.name}</h1>
        </div>
      </header>

      <main className="flex flex-col gap-4 px-4 pt-3">
        <PhotoSlot id={id} machineLike={machineLike} />
        {machineLike && <MachineSettings id={id} hints={tut.settingHints ?? []} />}
        {(mode === 'weights' || mode === 'bodyweight' || mode === 'timedSets') && <LoadSettings id={id} weighted={mode === 'weights'} />}
        <VideoLink id={id} search={tut.search} />

        <Steps title={h1} items={tut.setup} accent={accent} dot={dot} />
        <Steps title={h2} items={tut.steps} accent="text-lime" dot="bg-lime/15 text-lime" />
        <section className="flex flex-col gap-3 pt-1">
          <SectionLabel className="text-warn">Common mistakes</SectionLabel>
          {tut.mistakes.map((m) => (
            <div key={m} className="flex gap-3">
              <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-warn/15 text-warn" aria-hidden>
                <AlertTriangle size={14} />
              </span>
              <p className="text-[15px] leading-[22px]">{m}</p>
            </div>
          ))}
        </section>
        <p className="pt-2 text-xs leading-5 text-dim">
          General guidance, not medical advice. If something hurts (sharp pain, not effort), stop and ask the gym staff to check your setup.
        </p>
      </main>
    </div>
  );
}

function Steps({ title, items, accent, dot }: { title: string; items: string[]; accent: string; dot: string }) {
  return (
    <section className="flex flex-col gap-3 pt-1">
      <SectionLabel className={accent}>{title}</SectionLabel>
      <ol className="flex flex-col gap-3">
        {items.map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className={cx('grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full text-[13px] font-bold', dot)} aria-hidden>
              {i + 1}
            </span>
            <p className="text-[15px] leading-[22px]">{t}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PhotoSlot({ id, machineLike }: { id: string; machineLike: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const nav = useNav();

  useEffect(() => {
    let alive = true;
    let u: string | null = null;
    getPhoto(id)
      .then((b) => {
        if (alive && b) {
          u = URL.createObjectURL(b);
          setUrl(u);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [id]);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      const b = await compressImage(f);
      await putPhoto(id, b);
      setUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(b);
      });
      nav.toast('Photo saved on this phone');
    } catch {
      setErr('Couldn’t save that photo. Try again.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };
  const remove = async () => {
    await deletePhoto(id).catch(() => undefined);
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
  };

  const what = machineLike ? 'this machine' : 'your spot';
  return (
    <section aria-label="Photo">
      <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
      {url ? (
        <div className="relative overflow-hidden rounded-[20px] bg-surf">
          <img src={url} alt={`Your photo of ${what}`} className="max-h-[320px] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
            <Btn size="sm" variant="secondary" className="bg-black/60 text-sm" onClick={() => input.current?.click()} disabled={busy}>
              <Camera size={18} aria-hidden /> Retake
            </Btn>
            <IconBtn label="Delete photo" className="bg-black/60" onClick={() => void remove()}>
              <Trash2 size={18} aria-hidden />
            </IconBtn>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2.5 rounded-[20px] border-[1.5px] border-dashed border-dim bg-surf p-5 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-lime/[0.12] text-lime" aria-hidden>
            <Camera size={26} />
          </span>
          <p className="text-base font-semibold">{machineLike ? 'Snap this machine at your gym' : 'Add a reference photo'}</p>
          <p className="max-w-[300px] text-[13px] leading-[19px] text-muted">Saved on your phone, so you can spot it next time. Works offline.</p>
          <Btn size="sm" variant="outline" className="mt-1 h-11 text-[15px] font-semibold" onClick={() => input.current?.click()} disabled={busy}>
            <Camera size={18} aria-hidden /> {busy ? 'Saving…' : 'Take photo'}
          </Btn>
        </div>
      )}
      {err && (
        <p className="mt-2 text-sm text-warn" role="alert">
          {err}
        </p>
      )}
    </section>
  );
}

function MachineSettings({ id, hints }: { id: string; hints: string[] }) {
  const { state, dispatch } = useStore();
  const machine = settingsFor(state, id).machine;
  const nav = useNav();
  const [edit, setEdit] = useState<{ index: number | null; label: string; value: string } | null>(null);
  const startEdit = (e: { index: number | null; label: string; value: string }) => {
    setEdit(e);
    nav.open({ kind: 'sheet', id: 'machine-setting' });
  };
  const save = (list: MachineSetting[]) => dispatch({ type: 'updateSettings', id, patch: { machine: list } });
  const unused = hints.filter((h) => !machine.some((m) => m.label.toLowerCase() === h.toLowerCase()));

  return (
    <section className="flex flex-col gap-2.5 rounded-[18px] bg-surf p-3.5" aria-label="My machine settings">
      <SectionLabel className="flex items-center gap-2">
        <SlidersHorizontal size={16} aria-hidden /> My settings
      </SectionLabel>
      <div className="flex flex-wrap gap-2">
        {machine.map((m, i) => (
          <button key={i} type="button" onClick={() => startEdit({ index: i, ...m })} className="press min-h-11 rounded-full bg-ink/[0.08] px-3.5 text-sm font-semibold">
            {m.label} {m.value}
          </button>
        ))}
        {unused.slice(0, 2).map((h) => (
          <button key={h} type="button" onClick={() => startEdit({ index: null, label: h, value: '' })} className="press flex min-h-11 items-center gap-1 rounded-full border border-dashed border-lime px-3.5 text-sm font-semibold text-lime">
            <Plus size={14} aria-hidden /> {h}
          </button>
        ))}
        <button type="button" onClick={() => startEdit({ index: null, label: '', value: '' })} className="press flex min-h-11 items-center gap-1 rounded-full border border-dashed border-lime px-3.5 text-sm font-semibold text-lime">
          <Plus size={14} aria-hidden /> Add
        </button>
      </div>
      <p className="text-xs leading-[17px] text-dim">Seat and pad numbers you used. They show on the exercise card too.</p>

      {edit && nav.sheetOpen('machine-setting') && (
        <Sheet onClose={nav.back} label="Machine setting">
          <h2 className="font-display text-[26px] font-bold">{edit.index == null ? 'Add a setting' : 'Edit setting'}</h2>
          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const label = edit.label.trim();
              const value = edit.value.trim();
              if (!label || !value) return;
              const list = [...machine];
              if (edit.index == null) list.push({ label, value });
              else list[edit.index] = { label, value };
              save(list);
              nav.back();
            }}
          >
            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
              What
              <input
                value={edit.label}
                onChange={(e) => setEdit({ ...edit, label: e.target.value })}
                placeholder="Seat, back pad, handles…"
                maxLength={20}
                className="h-14 rounded-2xl border border-line bg-bg px-4 text-base text-ink placeholder:text-dim"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
              Setting
              <input
                autoFocus
                value={edit.value}
                onChange={(e) => setEdit({ ...edit, value: e.target.value })}
                placeholder="e.g. 4"
                maxLength={12}
                className="h-14 rounded-2xl border border-line bg-bg px-4 font-display text-2xl font-bold text-ink placeholder:text-dim"
              />
            </label>
            <Btn type="submit" variant="primary" disabled={!edit.label.trim() || !edit.value.trim()}>
              Save
            </Btn>
            {edit.index != null && (
              <Btn
                variant="danger"
                onClick={() => {
                  save(machine.filter((_, i) => i !== edit.index));
                  nav.back();
                }}
              >
                <Trash2 size={18} aria-hidden /> Remove
              </Btn>
            )}
          </form>
        </Sheet>
      )}
    </section>
  );
}

function LoadSettings({ id, weighted }: { id: string; weighted: boolean }) {
  const { state, dispatch } = useStore();
  const s = settingsFor(state, id);
  const step = s.weightStep ?? defaultWeightStep(id);
  const rest = s.restSeconds ?? defaultRest(id);
  const Opt = ({ on, children, onClick }: { on: boolean; children: ReactNode; onClick: () => void }) => (
    <button type="button" aria-pressed={on} onClick={onClick} className={cx('press min-h-11 flex-1 rounded-xl text-sm font-semibold tabular', on ? 'bg-lime text-onlime' : 'bg-line text-ink')}>
      {children}
    </button>
  );
  return (
    <section className="flex flex-col gap-3 rounded-[18px] bg-surf p-3.5" aria-label="Weight step and rest">
      {weighted && (
        <div className="flex flex-col gap-2">
          <SectionLabel>Weight step (kg)</SectionLabel>
          <div className="flex gap-2">
            {[1, 2, 2.5, 5].map((v) => (
              <Opt key={v} on={step === v} onClick={() => dispatch({ type: 'updateSettings', id, patch: { weightStep: v } })}>
                {fmtKg(v)}
              </Opt>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <SectionLabel>Rest between sets</SectionLabel>
        <div className="flex gap-2">
          {[45, 60, 90, 120].map((v) => (
            <Opt key={v} on={rest === v} onClick={() => dispatch({ type: 'updateSettings', id, patch: { restSeconds: v } })}>
              {v}s
            </Opt>
          ))}
        </div>
      </div>
    </section>
  );
}

function isHttpUrl(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

function VideoLink({ id, search }: { id: string; search: string }) {
  const { state, dispatch } = useStore();
  const online = useOnline();
  const pinned = settingsFor(state, id).videoUrl;
  const href = pinned ?? youtubeSearchUrl(search);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(pinned ?? '');
  const valid = isHttpUrl(text.trim());
  return (
    <section className="flex flex-col gap-2" aria-label="Form video">
      <a href={href} target="_blank" rel="noopener noreferrer" className="press flex min-h-[76px] items-center gap-3 rounded-[18px] bg-surf p-3.5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-warn/15 text-warn" aria-hidden>
          <PlayCircle size={24} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">{pinned ? 'Watch your pinned video' : 'Watch a form video'}</span>
          <span className={cx('flex items-center gap-1.5 text-xs', online ? 'text-muted' : 'text-heat')}>
            {!online && <WifiOff size={13} aria-hidden />}
            {online ? (pinned ? 'Opens your saved link' : 'Opens a YouTube search') : 'Needs signal. Try the lobby or at home.'}
          </span>
        </span>
        <ExternalLink size={20} className="shrink-0 text-dim" aria-hidden />
      </a>
      {!editing ? (
        <button type="button" onClick={() => setEditing(true)} className="press flex min-h-11 items-center gap-1.5 self-start px-1 text-sm font-medium text-muted">
          <Link2 size={16} aria-hidden /> {pinned ? 'Change pinned video' : 'Found a good one? Pin it here'}
        </button>
      ) : (
        <form
          className="flex flex-col gap-2 rounded-[18px] bg-surf p-3.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            dispatch({ type: 'updateSettings', id, patch: { videoUrl: text.trim() } });
            setEditing(false);
          }}
        >
          <label htmlFor={`vid-${id}`} className="text-sm font-medium text-muted">
            Paste a video link (in YouTube: Share → Copy link)
          </label>
          <input
            id={`vid-${id}`}
            type="url"
            inputMode="url"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="https://youtu.be/…"
            className="h-12 rounded-xl border border-line bg-bg px-3 text-[15px] placeholder:text-dim"
          />
          {text.trim() && !valid && <p className="text-xs text-warn">That doesn&rsquo;t look like a link. It should start with https://</p>}
          <div className="flex gap-2">
            <Btn size="sm" variant="primary" type="submit" className="flex-1" disabled={!valid}>
              Pin video
            </Btn>
            {pinned && (
              <Btn
                size="sm"
                variant="secondary"
                onClick={() => {
                  dispatch({ type: 'updateSettings', id, patch: { videoUrl: undefined } });
                  setText('');
                  setEditing(false);
                }}
              >
                Unpin
              </Btn>
            )}
            <IconBtn label="Cancel" className="h-12 w-12 rounded-xl bg-line" onClick={() => setEditing(false)}>
              <X size={18} aria-hidden />
            </IconBtn>
          </div>
        </form>
      )}
    </section>
  );
}
