import { Component, type ReactNode } from 'react';
import { STORAGE_KEY } from '../lib/logic';

/** Last line of defence: never leave a blank screen, and never lose the raw data. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; confirmReset: boolean }> {
  state = { error: null as Error | null, confirmReset: false };
  static getDerivedStateFromError(error: Error) {
    return { error, confirmReset: false };
  }
  download = () => {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '{}';
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gymtrack-raw-data.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center gap-4 p-6">
        <h1 className="font-display text-4xl font-bold">Something broke</h1>
        <p className="text-[15px] leading-6 text-muted">GymTrack hit an error it couldn&rsquo;t recover from. Your data is still on this phone. Try reloading first.</p>
        <pre className="max-h-32 overflow-auto rounded-xl bg-surf p-3 text-xs text-dim">{this.state.error.message}</pre>
        <button type="button" className="h-14 rounded-2xl bg-lime font-bold text-onlime" onClick={() => location.reload()}>
          Reload
        </button>
        <button type="button" className="h-14 rounded-2xl bg-line font-bold" onClick={this.download}>
          Download my data
        </button>
        {!this.state.confirmReset ? (
          <button type="button" className="h-12 text-sm font-semibold text-warn" onClick={() => this.setState({ confirmReset: true })}>
            Start fresh…
          </button>
        ) : (
          <button
            type="button"
            className="h-14 rounded-2xl bg-warn/15 font-bold text-warn"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              location.reload();
            }}
          >
            Yes, erase workout data (download it first!)
          </button>
        )}
      </div>
    );
  }
}
