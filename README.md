# GymTrack

Offline-first workout tracker PWA for World Gym Yongkang. React 19 + TypeScript + Tailwind v4 + vite-plugin-pwa. No backend: everything is stored on the phone (localStorage, plus IndexedDB for machine photos).

## Put it on your Android phone (GitHub Pages, free)

1. Create an empty GitHub repo, e.g. `gymtrack`.
2. Push this folder to it:
   ```bash
   git init && git add -A && git commit -m "GymTrack v1"
   git branch -M main
   git remote add origin https://github.com/<you>/gymtrack.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages → Build and deployment → Source: GitHub Actions**. The included workflow runs the tests, builds, and publishes.
4. After about a minute, open `https://<you>.github.io/gymtrack/` in **Chrome on your phone**.
5. Chrome menu (⋮) → **Add to Home screen → Install**. It then opens full-screen like a normal app.
6. Open it once with signal so it caches itself. After that it works in the basement with no signal.
7. In GymTrack: **History → Your data → Check storage protection**. It should say *Protected* once it's installed.

Any static host works (Netlify, Cloudflare Pages, Vercel). Just serve `dist/` over HTTPS.

## Develop

```bash
npm install        # .npmrc sets legacy-peer-deps
npm run dev        # http://localhost:5173
npm test           # 20 logic tests (vitest)
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173
```

## Where things live

| Path | What |
|---|---|
| `src/data/seed.json` | Exercise catalog + the 6-workout queue |
| `src/data/tutorials.ts` | How-to text for all 27 exercises + YouTube search terms |
| `src/data/catalog.ts` | Per-exercise defaults: weight step (2.5 kg; goblet squat 2 kg), rest (60 s; leg press & goblet squat 90 s), bodyweight list |
| `src/lib/logic.ts` | Queue, progression hint, session building, storage validation (pure, unit-tested) |
| `src/lib/store.tsx` | Reducer: sets, timers, rest, finish, settings |
| `src/lib/device.ts` | Beep, vibration, screen wake lock, persistent storage |
| `src/App.tsx` | Screens + Android back-button handling (every overlay/sheet/tab is a history entry) |

## Behaviour notes

- **Queue:** finishing the suggested workout moves it forward (6 → wraps to 1). Swapping in another workout never moves it, so the skipped one stays next.
- **Express:** uses each routine's `express_exercise_ids`. Rating energy **Low** turns Express on for the next check-in.
- **Timers** store an end time, so they stay right if the screen locks or Android kills the tab. The screen stays awake during a workout (Wake Lock). When a timer ends it beeps and vibrates.
- **Progression:** if every set hit its target reps at the same weight last time, the next session pre-fills one weight step higher and says so.
- **Backup:** History → Your data → Backup downloads one JSON file (including photos). Restore reads it back. Do this before changing phones or clearing Chrome data.
- **Icons:** `npm run icons` regenerates `public/icon-*.png` (needs Python + Pillow).
