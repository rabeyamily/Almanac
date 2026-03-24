# ALMANAC — Vintage Daily Habits Tracker

A vintage-themed iOS habit tracker built with Expo (React Native) and TypeScript.

## Tech Stack

- **Expo SDK 55** with Expo Router (file-based navigation)
- **TypeScript** (strict mode)
- **Supabase** — backend, auth, real-time sync
- **react-native-reanimated** — smooth animations
- **date-fns** — date formatting
- **Press Start 2P** + **Share Tech Mono** — Google Fonts for vintage aesthetic

## Setup

### 1. Clone and install

```bash
cd Almanac
npm install
```

### 2. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL editor, run the contents of `supabase/schema.sql`
3. Copy your **Project URL** and **anon key** from Project Settings → API

### 3. Configure environment

Edit `.env` in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the app

```bash
npx expo start
```

Then press `i` for iOS simulator or scan the QR code with Expo Go.

### Troubleshooting

- **`Cannot find module 'react-native-worklets/plugin'`** — Install deps: `npm install` (ensure `react-native-worklets` is in `package.json`). This project’s `babel.config.js` loads the worklets plugin via `require.resolve(...)` from the project root so Metro can always find it. Then: `npx expo start -c`.
- **`Cannot find module 'babel-preset-expo'`** — Metro resolves Babel presets from your app’s `node_modules`. Add `babel-preset-expo` (same major line as Expo SDK, e.g. `~55.0.x`) under `devDependencies`, run `npm install`, then `npx expo start -c`.
- **Node version** — Expo / RN 0.83 expect Node **≥ 20.19.4**. Upgrade if you see engine warnings.

## Project Structure

```
app/
  _layout.tsx          — Root layout, font loading, auth routing
  (auth)/
    login.tsx          — Login & signup screen
  (tabs)/
    index.tsx          — Home: live clock + progress overview
    tasks.tsx          — Daily tasks with vintage checkboxes
    timer.tsx          — Countdown timer + session history
    mood.tsx           — Mood selector + journal
  categories.tsx       — Category management (modal)

components/
  ui/                  — Shared design system components
  home/                — Home screen components
  tasks/               — Task list + add form
  timer/               — Countdown timer + history
  mood/                — Mood selector + journal
  categories/          — Category card + form

hooks/
  useAuth.ts           — Supabase auth state
  useTasks.ts          — Tasks CRUD + completions
  useSessions.ts       — Timer sessions CRUD
  useMood.ts           — Mood entries CRUD
  useCategories.ts     — Categories CRUD

lib/
  supabase.ts          — Supabase client (with AsyncStorage)
  types.ts             — All TypeScript types
  dateUtils.ts         — Date formatting helpers

constants/
  colors.ts            — Vintage color palette
  fonts.ts             — Font family names
  theme.ts             — Spacing, font sizes, borders

supabase/
  schema.sql           — Full database schema with RLS policies
```

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `paper` | `#F5E6C8` | Background |
| `ink` | `#1C1C1C` | Primary text |
| `green` | `#4A7C59` | Success / complete |
| `red` | `#C0392B` | Error / danger |
| `gold` | `#C9A84C` | Accent / warning |
| `Press Start 2P` | pixel font | Headlines, clock, labels |
| `Share Tech Mono` | monospace | Body text, inputs, meta |
