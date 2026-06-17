# DisrtuCare — Smart Pill Dispenser Companion App

A polished, offline-first Expo (React Native) mobile app for elderly users to manage medication schedules, track adherence, and view history alongside a standalone Arduino-based pill dispenser.

---

## Proposed Architecture

```
DisrtuCare/
├── App.tsx                    # Root navigator
├── src/
│   ├── db/
│   │   ├── database.ts        # SQLite setup & migrations
│   │   └── queries.ts         # All DB query functions
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── StatusBadge.tsx    # Taken/Missed/Late pill
│   │   ├── AdherenceRing.tsx  # % ring chart
│   │   ├── DoseCard.tsx       # AM / PM dose card
│   │   └── ConfirmModal.tsx   # "Mark as taken" confirmation
│   ├── hooks/
│   │   ├── useSchedule.ts     # Load/save AM-PM schedule
│   │   └── useLogs.ts         # Load/save adherence logs
│   ├── notifications/
│   │   └── notificationService.ts  # Local push reminders
│   ├── theme/
│   │   └── index.ts           # Colors, fonts, spacing tokens
│   └── utils/
│       └── dateHelpers.ts     # Format helpers
└── package.json
```

---

## Proposed Changes

### New Dependencies to Install
| Package | Purpose |
|---|---|
| `expo-sqlite` | Local SQLite database |
| `expo-notifications` | Local push reminders |
| `expo-router` or `@react-navigation/native` + `@react-navigation/bottom-tabs` | Tab navigation |
| `@react-navigation/native-stack` | Screen navigation |
| `react-native-safe-area-context` | Safe area support |
| `react-native-screens` | Perf native screens |
| `@expo/vector-icons` | Icons |
| `react-native-reanimated` | Smooth animations |
| `react-native-gesture-handler` | Gesture support for nav |

### Theme / Design System
- **Palette**: Soft deep navy (`#0F172A`) background, vibrant teal accent (`#14B8A6`), warm cream text (`#F8FAFC`), color-coded statuses (green/yellow/red).
- **Typography**: System font scaling + large base sizes (18–22px body) for elderly readability.
- **Spacing**: 8pt grid, generous touch targets (≥56px).

---

### Screen 1 — Dashboard (`DashboardScreen.tsx`)
- Prominent "Next Dose" card with countdown timer
- AM / PM dose cards with color-coded status badges
- Large **"Mark as Taken"** and **"Mark as Missed"** action buttons
- Animated status transition (fade + scale)
- Today's adherence percentage ring

### Screen 2 — History (`HistoryScreen.tsx`)
- Weekly calendar strip at top (swipeable)
- Day-by-day log list (AM/PM status per day)
- Color-coded rows (green/yellow/red)
- Monthly adherence summary at top

### Screen 3 — Settings (`SettingsScreen.tsx`)
- AM time picker
- PM time picker
- Medication name field
- Notification toggle
- "Reset today's logs" button

---

## Verification Plan

### Automated
- Run `expo start` and verify no compile errors
- Check SQLite DB initializes correctly on first launch

### Manual (via Expo Go)
- Navigate all 3 tabs without crashes
- Set AM/PM schedule → verify persists after restart
- Log a dose as Taken → verify green badge + DB record
- View History → confirm logged entries appear
- Check notifications scheduled after saving schedule
