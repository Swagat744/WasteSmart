# WasteSmart — Hostel Waste Management App

A React Native (Expo) mobile app for hostel waste management with role-based access for **Students** and **Cleaning Staff**.

---

## Features

### Student App
- Login with role detection
- Real-time bin fill levels (floor-wise)
- Submit cleaning requests with issue description
- Surplus food listing with QR scan to claim
- Rewards wallet — earn points for recycling & food claims
- Redemption tiers (mess voucher, laundry credit, etc.)

### Staff App
- Login with role detection
- Dashboard with shift info, task summary, critical bin alerts
- Task list with filter (pending / active / completed)
- Mark tasks as Started / Completed
- Pull-to-refresh for live updates

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo SDK 51) |
| Navigation | Expo Router (file-based) |
| State | React Context API |
| Storage | AsyncStorage (session persistence) |
| Camera/QR | expo-camera |
| Icons | @expo/vector-icons (Ionicons) |
| HTTP | Axios |

---

## Project Structure

```
WasteSmart/
├── app/
│   ├── _layout.jsx              # Root layout + auth guard
│   ├── (auth)/
│   │   └── login.jsx            # Shared login screen
│   ├── (student)/
│   │   ├── _layout.jsx          # Student tab navigator
│   │   ├── dashboard.jsx        # Bin status + request cleaning
│   │   ├── food.jsx             # Surplus food + QR scan
│   │   └── rewards.jsx          # Wallet + transaction history
│   └── (staff)/
│       ├── _layout.jsx          # Staff tab navigator
│       ├── dashboard.jsx        # Overview + critical bins
│       └── tasks.jsx            # Task list + mark complete
├── context/
│   └── AuthContext.jsx          # Global auth state + JWT storage
├── services/
│   └── api.js                   # ALL API calls (mock + real)
├── constants/
│   └── theme.js                 # Colors, fonts, spacing
└── assets/
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS or Android)

### Install & Run

```bash
# 1. Extract the zip and navigate into folder
cd WasteSmart

# 2. Install dependencies
npm install

# 3. Start the dev server
npx expo start

# 4. Scan QR code with Expo Go app on your phone
```

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Student | student@hostel.com | 123456 |
| Staff | staff@hostel.com | 123456 |

---

## Connecting to Real Backend

Everything is centralized in `services/api.js`. To go live:

### Step 1 — Change just 2 lines in `services/api.js`:
```js
const BASE_URL = 'https://your-real-backend.com/api'; // ← your Node.js URL
const USE_MOCK = false;                                 // ← flip to false
```

### Step 2 — Your backend must expose these endpoints:
```
POST   /api/login
GET    /api/bin-status
POST   /api/cleaning-request
GET    /api/tasks?staffId=:id
PATCH  /api/tasks/:id
GET    /api/food-items
POST   /api/claim-food
GET    /api/rewards/:studentId
```

All endpoints follow the API contracts defined in the project spec (Executive_Summary.pdf).

---

## Connecting to Admin Dashboard

The admin dashboard (React.js) and this mobile app share the **same backend API**. They connect via:
- Same `BASE_URL` pointing to your Node.js backend
- Same JWT token format from `POST /api/login`
- Same database (PostgreSQL) via shared ORM models

**No extra work needed** — just point both to the same backend.

---

## FCM Push Notifications (Production)

Push notifications are pre-wired via `expo-notifications`. To enable:

1. Create a Firebase project at console.firebase.google.com
2. Add your `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) to project root
3. Add to `app.json`:
```json
"plugins": [
  ["expo-notifications", {
    "googleServicesFile": "./google-services.json"
  }]
]
```
4. Backend sends FCM notifications when bins are critical or tasks are assigned.

---

## Build for Production

```bash
# Android APK
npx eas build --platform android --profile preview

# iOS
npx eas build --platform ios
```

Requires Expo EAS account (free tier available at expo.dev).

---

## Environment Variables (Production)

Create a `.env` file:
```
EXPO_PUBLIC_API_URL=https://your-backend.com/api
EXPO_PUBLIC_APP_ENV=production
```

Then in `api.js`:
```js
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
```

---

Built for VESIT Hostel · WasteSmart v1.0
