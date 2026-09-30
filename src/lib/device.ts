/** Small wrappers around device APIs. Every one of them fails soft. */

let audioCtx: AudioContext | null = null;

/** Must be called from a tap once, so later beeps are allowed to play. */
export function unlockAudio() {
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
  } catch {
    /* no audio */
  }
}

export function beep(times = 3) {
  try {
    unlockAudio();
    const ctx = audioCtx!;
    for (let i = 0; i < times; i++) {
      const t = ctx.currentTime + i * 0.28;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = i === times - 1 ? 1320 : 880;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.22);
    }
  } catch {
    /* ignore */
  }
}

export function buzz(pattern: number | number[] = [200, 100, 200]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

export const tapFeedback = () => buzz(12);

let lock: WakeLockSentinel | null = null;
let wanted = false;

async function acquire() {
  if (!wanted || lock || document.visibilityState !== 'visible') return;
  try {
    lock = (await navigator.wakeLock?.request('screen')) ?? null;
    lock?.addEventListener('release', () => {
      lock = null;
    });
  } catch {
    lock = null;
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => void acquire());
}

/** Keep the screen on while a session is running. */
export function setKeepAwake(on: boolean) {
  wanted = on;
  if (on) void acquire();
  else {
    void lock?.release().catch(() => undefined);
    lock = null;
  }
}

/** Ask the browser not to evict our data. Installed PWAs on Android usually get this. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
