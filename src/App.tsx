import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { BarChart3, House, ListOrdered } from 'lucide-react';
import { useStore } from './lib/store';
import { useNow } from './lib/hooks';
import { beep, buzz, setKeepAwake } from './lib/device';
import { cx, Toast } from './components/ui';
import Home from './screens/Home';
import Queue from './screens/Queue';
import History from './screens/History';
import Session from './screens/Session';
import HowTo from './screens/HowTo';
import Finish from './screens/Finish';
import SwapSheet from './screens/SwapSheet';

export type Overlay =
  | { kind: 'session' }
  | { kind: 'swap' }
  | { kind: 'howto'; id: string }
  | { kind: 'finish' }
  /** Bottom sheets owned by a screen; the owner renders them while `nav.sheetOpen(id)` */
  | { kind: 'sheet'; id: string };
export type Tab = 'today' | 'queue' | 'history';

interface Nav {
  open: (o: Overlay) => void;
  replaceTop: (o: Overlay) => void;
  back: () => void;
  closeAll: () => void;
  sheetOpen: (id: string) => boolean;
  setTab: (t: Tab) => void;
  pick: string | null;
  setPick: (id: string | null) => void;
  toast: (t: string) => void;
  now: number;
}
const NavCtx = createContext<Nav | null>(null);
export const useNav = () => {
  const v = useContext(NavCtx);
  if (!v) throw new Error('useNav outside App');
  return v;
};

const isFull = (o: Overlay) => o.kind !== 'swap' && o.kind !== 'sheet';

export default function App() {
  const { state, dispatch } = useStore();
  const [tab, setTabState] = useState<Tab>('today');
  const tabRef = useRef<Tab>('today');
  const [stack, setStack] = useState<Overlay[]>([]);
  const stackRef = useRef(stack);
  const [pick, setPick] = useState<string | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimer = useRef<number>(0);

  const commit = (s: Overlay[]) => {
    stackRef.current = s;
    setStack(s);
  };

  // ---- Android back button: every overlay, sheet and non-Today tab is a history entry ----
  // `navPending` blocks a second back/closeAll before the first popstate lands,
  // otherwise two quick taps could walk history right out of the app.
  const navPending = useRef(false);
  const hadActiveAtLaunch = useRef(!!state.active);
  useEffect(() => {
    // On a reload, the browser keeps our old history entries. Line the stack back up
    // with them instead of stacking new ones on top (which would leave dead back presses).
    const st = history.state;
    const d = typeof st?.depth === 'number' ? st.depth : 0;
    const t0: Tab = st?.tab ?? 'today';
    tabRef.current = t0;
    setTabState(t0);
    if (hadActiveAtLaunch.current) {
      if (d >= 1) {
        commit([{ kind: 'session' }]);
        if (d > 1) {
          navPending.current = true;
          history.go(-(d - 1));
        }
      } else {
        history.pushState({ depth: 1, tab: t0 }, '');
        commit([{ kind: 'session' }]);
      }
    } else if (d > 0) {
      navPending.current = true;
      history.go(-d);
    } else history.replaceState(t0 === 'today' ? { depth: 0 } : { depth: 0, tab: t0 }, '');
    const onPop = (e: PopStateEvent) => {
      navPending.current = false;
      const depth = typeof e.state?.depth === 'number' ? e.state.depth : 0;
      const t: Tab = e.state?.tab ?? 'today';
      tabRef.current = t;
      setTabState(t);
      commit(stackRef.current.slice(0, depth));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const open = useCallback((o: Overlay) => {
    if (navPending.current) return;
    const depth = stackRef.current.length + 1;
    history.pushState({ depth, tab: tabRef.current }, '');
    commit([...stackRef.current, o]);
  }, []);
  const replaceTop = useCallback((o: Overlay) => {
    const s = stackRef.current;
    if (navPending.current || !s.length) return;
    history.replaceState({ depth: s.length, tab: tabRef.current }, '');
    commit([...s.slice(0, -1), o]);
  }, []);
  const back = useCallback(() => {
    if (navPending.current || !stackRef.current.length) return;
    navPending.current = true;
    history.back();
  }, []);
  const closeAll = useCallback(() => {
    const n = stackRef.current.length;
    if (navPending.current || !n) return;
    navPending.current = true;
    history.go(-n);
  }, []);
  const sheetOpen = useCallback((id: string) => stack.some((o) => o.kind === 'sheet' && o.id === id), [stack]);
  const setTab = useCallback((t: Tab) => {
    const cur = tabRef.current;
    window.scrollTo(0, 0);
    if (t === cur || navPending.current) return;
    if (t === 'today') {
      if (history.state?.tab && !history.state?.depth) {
        navPending.current = true;
        history.back(); // popstate restores Today
        return;
      }
      history.replaceState({ depth: 0 }, '');
    } else if (cur === 'today') history.pushState({ depth: 0, tab: t }, '');
    else history.replaceState({ depth: 0, tab: t }, '');
    tabRef.current = t;
    setTabState(t);
  }, []);
  const toast = useCallback((t: string) => {
    setToastText(t);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastText(null), 3000);
  }, []);

  // ---- session clock: timers + rest finish even while on another screen ----
  const a = state.active;
  const now = useNow(!!a, 250);
  useEffect(() => {
    if (!a) return;
    if (a.rest?.endsAt != null && a.rest.endsAt <= now) {
      dispatch({ type: 'restSkip' });
      beep(2);
      buzz([200, 80, 200]);
    }
    for (const [key, t] of Object.entries(a.timers)) {
      if (t.endsAt != null && t.endsAt <= now) {
        dispatch({ type: 'timerDone', key, now });
        beep(3);
        buzz([300, 100, 300, 100, 300]);
      }
    }
  }, [now, a, dispatch]);

  useEffect(() => {
    setKeepAwake(!!a);
  }, [a]);

  // If the session vanished (finished/discarded), drop session-only overlays.
  useEffect(() => {
    if (!a && stack.some((o) => o.kind === 'session' || o.kind === 'finish')) closeAll();
  }, [a, stack, closeAll]);

  const nav: Nav = { open, replaceTop, back, closeAll, sheetOpen, setTab, pick, setPick, toast, now };
  const anyFull = stack.some(isFull);

  return (
    <NavCtx.Provider value={nav}>
      <div className="mx-auto min-h-dvh max-w-[480px] pb-[calc(88px+env(safe-area-inset-bottom))]" aria-hidden={anyFull || undefined}>
        {tab === 'today' && <Home />}
        {tab === 'queue' && <Queue />}
        {tab === 'history' && <History />}
      </div>
      <BottomNav tab={tab} setTab={setTab} hidden={anyFull} />

      {stack.map((o, i) => {
        if (o.kind === 'sheet') return null;
        const hidden = stack.slice(i + 1).some(isFull);
        const k = `${o.kind}-${i}`;
        if (o.kind === 'swap') return <SwapSheet key={k} />;
        return (
          <div key={k} className={cx('fixed inset-0 z-40 overflow-y-auto bg-bg', hidden && 'invisible')} aria-hidden={hidden || undefined}>
            <div className="mx-auto max-w-[480px]">
              {o.kind === 'session' && (a ? <Session /> : null)}
              {o.kind === 'howto' && <HowTo id={o.id} />}
              {o.kind === 'finish' && (a ? <Finish /> : null)}
            </div>
          </div>
        );
      })}
      <Toast text={toastText} />
    </NavCtx.Provider>
  );
}

function BottomNav({ tab, setTab, hidden }: { tab: Tab; setTab: (t: Tab) => void; hidden: boolean }) {
  const items: [Tab, string, typeof House][] = [
    ['today', 'Today', House],
    ['queue', 'Queue', ListOrdered],
    ['history', 'History', BarChart3],
  ];
  return (
    <nav
      className={cx('fixed inset-x-0 bottom-0 z-30 border-t border-line/60 bg-surf pb-safe', hidden && 'hidden')}
      aria-label="Main"
    >
      <div className="mx-auto flex h-20 max-w-[480px] items-center justify-around px-2">
        {items.map(([k, label, Icon]) => {
          const on = tab === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              aria-current={on ? 'page' : undefined}
              className="press flex w-24 flex-col items-center gap-1 py-1"
            >
              <span className={cx('grid h-8 w-16 place-items-center rounded-2xl', on && 'bg-lime/15')}>
                <Icon size={22} className={on ? 'text-lime' : 'text-muted'} aria-hidden />
              </span>
              <span className={cx('text-xs', on ? 'font-semibold text-ink' : 'font-medium text-muted')}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
