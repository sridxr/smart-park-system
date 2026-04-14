<<<<<<< HEAD
# SmartPark AI

SmartPark AI is a production-style MERN parking operating system with multi-role dashboards, AI-driven recommendations, dynamic pricing, admin intelligence, map-based discovery, Firebase-powered Google login support, and Razorpay test payments.

## Product Highlights

- AI-powered parking recommendation engine using price, availability, distance, and car fit
- Demand prediction and predictive availability messaging
- Dynamic pricing guidance for lenders
- Google Maps marker discovery, location search, and map-based listing creation
- Role-based dashboards for users, lenders, and admins
- Booking lifecycle management with automatic pending booking expiry
- Admin decision-support analytics with trends, alerts, and demand zone monitoring

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, Recharts, Google Maps API
- Backend: Node.js, Express, MongoDB, Mongoose, JWT
- Integrations: Firebase Authentication, Nodemailer, Razorpay

## Folder Structure

```text
smart-parking/
├─ client/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ context/
│  │  ├─ lib/
│  │  ├─ pages/
│  │  ├─ api.js
│  │  ├─ App.jsx
│  │  ├─ index.css
│  │  └─ main.jsx
│  ├─ .env.example
│  └─ package.json
├─ server/
│  ├─ config/
│  ├─ middleware/
│  ├─ models/
│  ├─ routes/
│  ├─ services/
│  ├─ utils/
│  ├─ .env.example
│  ├─ package.json
│  └─ server.js
└─ README.md
```

## Core Backend Modules

- `server/models/user.js`: user identity, role, favorites, account status, revenue fields
- `server/models/parking.js`: parking inventory, location, slots, price, demand, and live metrics
- `server/models/Booking.js`: booking transactions, payment metadata, expiry lifecycle
- `server/utils/aiEngine.js`: recommendation scoring, demand prediction, fit logic, explanation generation
- `server/services/bookingLifecycleService.js`: booking auto-expiry and slot restoration
- `server/services/analyticsService.js`: admin and lender trend data, role distribution, demand-zone intelligence

## Setup Instructions

1. Install dependencies.

```powershell
cd C:\Users\srida\smart-parking\client
npm install
cd C:\Users\srida\smart-parking\server
npm install
```

2. Configure environment variables.

- Copy `client/.env.example` to `client/.env`
- Copy `server/.env.example` to `server/.env`
- Add MongoDB URI, JWT secret, Firebase credentials, Google Maps API key, SMTP credentials, and Razorpay test keys

3. Start the backend.

```powershell
cd C:\Users\srida\smart-parking\server
npm run dev
```

4. Start the frontend.

```powershell
cd C:\Users\srida\smart-parking\client
npm run dev
```

5. Promote an admin user manually in MongoDB if needed.

- Update the target user document and set `"role": "admin"`

## Key User Flows

- User: search parking on map, get AI recommendations, save favorites, chat with AI assistant, book and pay
- Lender: add parking on map, monitor occupancy, review revenue trends, inspect AI pricing signals
- Admin: monitor users, bookings, demand zones, platform alerts, and decision-support insights

## Notes

- Google Maps features require `VITE_GOOGLE_MAPS_API_KEY`
- Google login requires both Firebase frontend config and Firebase Admin server config
- Razorpay runs in test mode when test credentials are supplied
- Pending direct bookings expire automatically after 15 minutes and release reserved slots
=======
# smart-park-system
>>>>>>> 139d7b4e21a52b1f4acc39f0d9799f6e38ea63f0
