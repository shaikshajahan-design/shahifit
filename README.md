# ShahiFit

A personal, mobile-first fitness tracker for **Food**, **Steps** and **Gym**.
It's an installable PWA that works offline and keeps every record on your own device. It costs ₹0 to run: hosting is free on GitHub Pages, and there are no APIs, accounts, database servers or tracking.

---

## Architecture (Version 1)

| Layer | Choice |
|---|---|
| UI | React 19 + TypeScript, built with Vite |
| Styling | Plain modern CSS with design tokens (light/dark), system font stack |
| Icons / charts | lucide-react, Recharts (lazy-loaded) |
| Storage | IndexedDB through Dexie, behind a repository layer |
| Offline / install | `vite-plugin-pwa`: Workbox service worker + `manifest.webmanifest` (generated at build time from `vite.config.ts`; icons in `public/icons/`) |
| Hosting | GitHub Pages, deployed by GitHub Actions |

```
src/
├── components/          reusable UI (BottomSheet, ConfirmDialog, ProgressBar, ProgressRing,
│   └── charts/          DateSelector, StatCard, EmptyState, Field, Toast …) + chart components
├── pages/TabPanel.tsx   FOOD | STEPS | GYM view switch
├── features/
│   ├── food/            Food tab, meal sheet, food form, quick calories, weekly chart
│   ├── steps/           Steps tab, entry sheet, month calendar, weekly chart
│   ├── gym/             Gym tab, workout logger, checklist, schedule, history, monthly stats
│   ├── weight/          Weight sheet (opened from the scale icon)
│   ├── water/           Water card (inside Food)
│   └── settings/        Settings, backup / restore / delete
├── db/
│   ├── db.ts            Dexie schema (versioned) + first-run seed
│   └── repositories/    food, savedFood, step, workout, weight, water, settings
├── services/
│   ├── backupService.ts export / validate / restore (schemaVersion: 1)
│   └── calculations/    pure, unit-tested maths (nutrition, steps, gym, weight)
├── hooks/               live data hooks, selected-date context, theme, back-button handling
├── data/                constants, default settings, starter foods, workout templates
├── types/               TypeScript models
├── utils/               local-date helpers (no UTC shifts), formatting
└── styles/              tokens.css, base.css, components.css
```

Some design decisions:

- **Dates** are stored as local `YYYY-MM-DD` strings and never go through `toISOString()`, so an entry can't jump to the previous or next day because of UTC conversion. The selected date drives all three tabs.
- **UI never touches the database directly.** Components read through hooks in `src/hooks/useData.ts`, and every write goes through a repository.
- **Estimates are labelled as estimates.** Gym calories use `MET × body weight × hours`, shown as `~value` with a ±20% range. Walking distance uses stride ≈ 0.415 × height, and walking calories use about 0.5 kcal per kg per km. Exercise calories are **never** subtracted from your food target.
- **Starter data** is 10 common foods, marked "Starter" in My Foods, plus a small exercise library. No fake history is created.
- **The Android back button** closes the open sheet instead of leaving the app.

---

## A. Run it on your computer

You need **Node.js 20 or newer** (22 recommended). You can get it from https://nodejs.org.

```bash
cd shahifit
npm install        # first time only
npm run dev        # open the printed URL, e.g. http://localhost:5173/shahifit/
```

Other commands:

```bash
npm test           # unit tests (calculations, streaks, backup round-trip)
npm run build      # production build into dist/
npm run preview    # serve the production build at http://localhost:4173/shahifit/
```

> The service worker (offline mode) is only active in the production build (`npm run build && npm run preview`), not in `npm run dev`.

---

## B. Publish on GitHub Pages (free)

1. **Create the repository.** Sign in at https://github.com and choose **New repository**. Name it exactly **`shahifit`**. It can be **Public** (free Pages works on public repos with any plan). Don't add a README; the project already has one.
2. **Upload the project.** You can do this from the website or with git.
   - *Website:* open the new repo, click **uploading an existing file**, and drag in everything inside the `shahifit` folder, including the hidden `.github` folder. Leave out `node_modules` and `dist`. Then click **Commit changes**.
     If your file browser hides `.github`, use the git method instead.
   - *Git (recommended):*
     ```bash
     cd shahifit
     git init
     git add .
     git commit -m "ShahiFit v1"
     git branch -M main
     git remote add origin https://github.com/YOUR_GITHUB_USERNAME/shahifit.git
     git push -u origin main
     ```
3. **Enable GitHub Pages.** In the repo, go to **Settings → Pages**.
4. **Set the source to GitHub Actions.** Under **Build and deployment → Source**, choose **GitHub Actions**.
5. **Deploy.** Each push to `main` runs `.github/workflows/deploy.yml`, which installs, tests, builds and deploys. If Pages was enabled after your first push, open **Actions → Deploy ShahiFit to GitHub Pages → Run workflow** once.
6. **Find the website.** After the green tick in **Actions** (about 1–2 minutes), your app is at
   **`https://YOUR_GITHUB_USERNAME.github.io/shahifit/`**
   The link is also shown in **Settings → Pages**.

> If you name the repository something other than `shahifit`, change `const BASE = '/shahifit/'` in `vite.config.ts` to `'/<your-repo-name>/'`.

---

## C. Install on your Android phone

1. Open **Chrome** on the phone and go to `https://YOUR_GITHUB_USERNAME.github.io/shahifit/`.
2. Wait for the page to load fully. A small "ready to work offline" message appears the first time.
3. Tap **⋮ (menu) → Add to Home screen → Install**. Chrome may also show an **Install app** banner.
4. Open **ShahiFit** from your home screen. It runs full-screen like a normal app and works without internet.

**Your data lives on the phone** (in Chrome's storage for this app). Export a backup regularly: **Settings → Export Backup** saves `shahifit-backup-YYYY-MM-DD.json` to Downloads. Keep a copy somewhere safe, such as Google Drive. If you clear Chrome's site data or uninstall the app, only a backup can bring your records back.

**Moving to a new phone:** Export on the old phone, copy the file over, install ShahiFit on the new phone, then use **Settings → Restore Backup**.

---

## Updating the app later

1. Edit the code, then run `npm run build` locally to check it builds.
2. `git add . && git commit -m "describe change" && git push`
3. GitHub Actions redeploys automatically.
4. On your phone, open ShahiFit. When the "new version is available" bar appears, tap **Update**.

Your data isn't affected by updates. If you ever change the database structure, add a new `this.version(2)` in `src/db/db.ts` and a matching step in `migrate()` in `src/services/backupService.ts`, so older backups still import.

---

## D. Testing checklist (after deployment)

- [ ] Live URL loads and opens on **FOOD**
- [ ] Add a food from My Foods, a custom food, and quick calories; totals and protein update
- [ ] Edit a food, delete it, and use **Undo**
- [ ] Close the app completely, reopen it, and check the food is still there
- [ ] Go to the previous day, add food, return to today, and check both days are correct
- [ ] Enter steps (e.g. 8,742): **87%** and **1,258 remaining** are shown; `-5` is rejected
- [ ] Enter ≥10,000 for the past two days and check the streak shows **2-day 10K streak**
- [ ] Log a workout by ticking exercises and setting duration and intensity: the summary shows **~kcal** and **Workout completed**
- [ ] Open an older workout from **Recent workouts**
- [ ] Add a weight entry and water
- [ ] **Export Backup**, then **Delete All Data**, then **Restore Backup**: everything comes back
- [ ] Turn on **Airplane mode**, reopen the app, and add something: it still works
- [ ] Install from Chrome and launch from the home screen (opens full-screen)
- [ ] Android back button closes sheets instead of exiting

---

## E. Future-ready notes (not implemented in V1)

- **Health Connect / automatic steps:** needs a native wrapper (e.g. a small Capacitor/TWA Android shell). Plug it into `stepRepository.set()`. The UI already reads steps only through that repository.
- **Cloud backup / sync:** add a `syncService` next to `backupService` that uploads the same JSON format (e.g. to the user's own Google Drive). `schemaVersion` already supports migrations.
- **AI insights:** would read the pure functions in `services/calculations/` and render in an optional card. Keep it out of the core logging flow.
- **Multiple devices:** would need an account plus a backend. The repository layer is the single place to swap IndexedDB for a sync-capable store.

---

### Privacy

No analytics, no trackers, no ads, no external requests after loading. Fitness data never leaves the device except in backup files you export yourself. The repository contains only application code. `.gitignore` also blocks `shahifit-backup-*.json` so backups can't be committed by accident.
