import { useEffect, useState } from 'react';

export const OFFLINE_READY_KEY = 'gymtrack:offlineReady';

/** Re-render on an interval while `enabled`. Returns Date.now() at last tick. */
export function useNow(enabled: boolean, ms = 250): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), ms);
    const vis = () => setNow(Date.now());
    document.addEventListener('visibilitychange', vis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
    };
  }, [enabled, ms]);
  return now;
}

export function useOnline(): boolean {
  const [on, setOn] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const up = () => setOn(true);
    const down = () => setOn(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return on;
}

export function useOfflineReady(): boolean {
  const read = () => {
    try {
      return localStorage.getItem(OFFLINE_READY_KEY) === '1' || !!navigator.serviceWorker?.controller;
    } catch {
      return false;
    }
  };
  const [ready, setReady] = useState(read);
  useEffect(() => {
    const on = () => setReady(true);
    window.addEventListener('gymtrack:offline-ready', on);
    navigator.serviceWorker?.addEventListener?.('controllerchange', on);
    return () => {
      window.removeEventListener('gymtrack:offline-ready', on);
      navigator.serviceWorker?.removeEventListener?.('controllerchange', on);
    };
  }, []);
  return ready;
}

export const fmtClock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
export const fmtElapsed = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};
export const fmtKg = (n: number | null | undefined) => {
  if (n == null) return '–';
  return Number.isInteger(n) ? String(n) : n.toFixed(n * 10 === Math.round(n * 10) ? 1 : 2);
};
