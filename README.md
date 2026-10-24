# Clinicus

A multi-branch clinic management app for iOS and Android, built with React Native and Expo (SDK 53).

## Features

| Module | What it does |
| --- | --- |
| **Dashboard** | Today's summary and next appointment; KPIs for income, appointments, new patients and collection rate (with change vs. the previous period and sparklines); upcoming appointments; alerts; clinic load; top doctors. |
| **Calendar** | Week strip and month view, clinic/doctor filters, daily agenda. Create, edit, reschedule and delete appointments. |
| **Appointments** | Doctor-specific free/busy time slots (no double-booking), Sunday closure, automatic fee by appointment type. Mark as completed (adds the fee as a receivable), no-show or cancelled, with undo. Collect payment. |
| **Patients** | A–Z list, search, filters (new / owing money / allergies). Patient record with medical info (allergies, chronic conditions, blood type, insurance), visit history, payments and balance, timestamped notes, call/SMS/email. |
| **Finance** | Month / last month / year views with net profit, collection rate and receivables; interactive daily income chart compared with the previous period; 12-month income vs. expense bars; income by clinic and doctor; expense breakdown. Add income and expenses. Share reports as text and CSV. |
| **Reports** | Completion, no-show and cancellation rates; average fee; monthly appointments and revenue; distribution by specialty and appointment type; busiest hours and weekdays. |
| **Personnel** | Search and filters, profiles (appointment and income stats for doctors, team), add/edit/delete, profile photo (gallery or camera). |
| **Clinics** | Per-branch KPIs, today's schedule, critical stock and team. |
| **Inventory** | Critical / out-of-stock tracking, inline +/− adjustment, stock value, add/edit items. |
| **Requests** | Leave and special requests, approve/reject with undo. |
| **Notifications** | Derived alerts for today's appointments, pending requests, critical stock and overdue payments. Read state is saved. |
| **Search** | Searches patients, appointments, personnel, inventory and transactions at once. |
| **Settings** | Light / dark / system theme, Face ID / Touch ID app lock, hide amounts, haptics, JSON data export, demo data reset. |

Also included: a quick-action **+** button in the tab bar, toast notifications with undo, haptic feedback, deep links (`clinicus://patients/h1`), and accessibility labels.

Data is stored on the device in AsyncStorage (`clinic-app/data/v2`; v1 data is migrated automatically). On first launch the app loads 12 months of realistic demo data generated from a deterministic seed.

## Setup

```bash
npm install
cp .env.example .env   # Firebase values
npm start
```

In the Firebase console, enable **Authentication → Email/Password**. Without Firebase, the login screen offers **"Demo modunda devam et"** in development. Set `EXPO_PUBLIC_DEMO_AUTOLOGIN=1` to start the demo session automatically.

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run ios` / `npm run android` | Run on a simulator or emulator |
| `npm test` | Jest: unit, selector, reducer and screen-flow tests |
| `npm run lint` | ESLint (eslint-config-expo) |

## Architecture

```
App.js                       Fonts, splash, providers (SafeArea, Auth, AppData, Theme, Toast), linking
src/
  navigation/                RootNavigator (auth/app stacks, modal forms), TabBar (+ quick actions)
  shared/
    theme/                   Light/dark tokens, typography (Inter), ThemeProvider + useStyles
    components/              AppText, Screen, Card, ListItem, Button, Sheet, SelectField, FormScreen,
                             KpiCard, Toast, charts (AreaChart, BarChart, DonutChart, Sparkline)…
    context/                 AuthContext (Firebase + demo), AppDataContext (reducer, persistence)
    data/                    seed.js (deterministic demo data), constants, clinics
    hooks/ utils/            Haptics, date/format/random helpers
  modules/<feature>/
    screens/ components/ data/   Feature screens, components and pure selectors
```

Business rules live in pure functions under `data/`, such as selectors, validators and the reducer, and are covered by tests. Screens consume them through hooks.

## License

Private project.
