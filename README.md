# AgriFlow 🌱 — Complete Production Guide

**Agricultural Procurement & Queue Management Platform** — full-stack (React 18 + Node.js + MongoDB + Socket.IO).

---

## Quick Start

```bash
# 1. Clone & install
cd AgriFlow
npm run install:all

# 2. Configure environment
cp .env.example backend/.env
# Edit backend/.env with your MongoDB URI and JWT secret

# 3. Seed demo data (optional — creates demo users, centres, appointments, queue, procurement, payments, notifications, audit logs)
node backend/seeder.js

# 4. Start both servers
npm run dev:backend   # port 5000
npm run dev:frontend  # port 3000 (with /api + /socket.io proxy)
```

Visit `http://localhost:3000`.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite + React Router v6   |
| Backend   | Node.js + Express 5 + Socket.IO     |
| Database  | MongoDB + Mongoose                  |
| Auth      | JWT (jsonwebtoken) + bcryptjs       |
| Real-time | Socket.IO (rooms: centre, user)     |
| Theme     | Custom CSS variables (green agri)   |

---

## All Features (Phases 1–15)

### Farmer
- Dashboard (`/farmer/dashboard`) — stats, quick actions
- Profile (`/farmer/profile`) — edit farm info, change password
- Centres (`/farmer/centres`) — browse, filter by district
- Book Appointment (`/farmer/appointments/book`) — select centre, commodity, date, slot
- Appointments (`/farmer/appointments`) — view, cancel, reschedule with modal
- Queue (`/farmer/queue`) — live status, check-in, Socket.IO updates
- Procurement (`/farmer/procurement`) — status tracking (verified → weighed → procured → paid/rejected)
- Payments (`/farmer/payment`) — view status per procurement
- Notifications (`/farmer/notifications`) — real-time, mark read/all

### Admin / Operator
- Dashboard (`/admin/dashboard`) — system health + operational stats
- Centres (`/admin/centres`) — create, edit, activate
- Queue (`/admin/queue`) — live board, call next, complete, no-show
- Farmers (`/admin/farmers`) — list, verify status
- Users (`/admin/users`) — user management
- Appointments — tracked via appointment system
- Procurement (`/admin/procurements`) — lifecycle actions (verify, weigh, procure, initiate/completion payment, reject)
- Payments (`/admin/payments`) — filter, update status
- Notifications (`/admin/notifications`) — mark read
- Audit Logs (`/admin/audit`) — filter/search by action, model, user, centre, date range
- Reports (`/admin/reports`) — operational summary + dashboard totals

---

## Authentication Flow

1. `POST /api/auth/register` → creates user (farmer/admin)
2. `POST /api/auth/login` → JWT token
3. Token stored in `localStorage` (`agriflow_token`, `agriflow_role`)
4. `ProtectedRoute` guards by role (`farmer` / `admin`)
5. Logout clears storage

---

## Key API Endpoints

| Method | Endpoint                     | Access    | Purpose                        |
|--------|------------------------------|-----------|--------------------------------|
| GET    | `/api/status`                | Public    | Health + DB check              |
| POST   | `/api/auth/register`         | Public    | Create user                    |
| POST   | `/api/auth/login`            | Public    | Login → JWT                    |
| GET/PUT| `/api/farmers/me`             | Farmer    | Profile                        |
| GET    | `/api/centres`               | Auth      | List centres                   |
| GET    | `/api/appointments/my`       | Farmer    | My appointments                |
| POST   | `/api/appointments`          | Farmer    | Book                           |
| GET    | `/api/appointments/slots`    | Auth      | Available slots                |
| PATCH  | `/api/queue/checkin`         | Farmer    | Check into queue               |
| GET    | `/api/queue/:centreId/my`    | Auth      | My queue entry                 |
| GET    | `/api/queue/:centreId`       | Auth      | Full queue                     |
| PATCH  | `/api/queue/:entryId/call-next` | Admin  | Call next                      |
| PATCH  | `/api/queue/:entryId/complete`  | Admin  | Complete service               |
| GET    | `/api/procurements/my`       | Farmer    | My procurements                |
| GET/PUT| `/api/notifications`         | Auth      | List / create                  |
| PATCH  | `/api/notifications/read-all`| Auth      | Mark all read                  |
| GET    | `/api/audit`                 | Admin     | Filter/search audit logs       |
| GET    | `/api/audit/reports/operational`| Admin | Operational summary           |
| GET    | `/api/audit/reports/dashboard`  | Admin | Dashboard totals              |

---

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/agriflow
JWT_SECRET=<long-random-string>
CLIENT_URL=http://localhost:3000
```

---

## Database Schema Overview

- `User` (name, email, password, role: farmer/admin)
- `Farmer` (user, farmName, location, cropTypes, contactPhone, isVerified, bankDetails)
- `Centre` (name, location, capacityPerDay, activeCommodities, operatingHours, counters, slots)
- `Appointment` (tokenNumber, farmer, centre, scheduledDate, timeSlot, commodity, estimatedQuantity, status)
- `BookingSlot` (centre, date, timeSlot, maxCapacity, bookedCount)
- `DailyCounter` (centre, date, tokenCounter — atomic increment)
- `Queue` (centre, appointment, farmer, tokenNumber, status, joinedAt, completedAt)
- `Procurement` (farmer, centre, appointment, commodity, status, verifiedAt, weighedAt, procuredAt, ratePerKg, totalAmount, weighingDetails)
- `Payment` (procurement, farmer, amount, method, transactionId, status: pending/processing/successful/failed, paidAt)
- `Notification` (user, title, message, type, isRead)
- `AuditLog` (actor, action, targetModel, targetId, centre, details, ipAddress)

---

## Verification Checklist (Production Ready)

- [ ] `npm run install:all`
- [ ] `cp .env.example backend/.env` and configure MongoDB + JWT
- [ ] `node backend/seeder.js` (seed demo data)
- [ ] `npm run dev:backend` → `MongoDB Connected` + port 5000
- [ ] `curl http://localhost:5000/api/status` → `{"status":"ok","db":"connected"}`
- [ ] `npm run dev:frontend` → loads at `localhost:3000`
- [ ] Register / Login → JWT returned
- [ ] `/farmer/dashboard` → protected; shows stats and quick actions
- [ ] `/farmer/appointments/book` → selects centre, commodity, date, slot
- [ ] `/farmer/appointments` → list, cancel, reschedule
- [ ] `/farmer/queue` → check-in; Socket.IO updates live
- [ ] `/admin/queue` → admin board; call-next, complete, no-show
- [ ] `/admin/procurements` → verify → weigh → procure → payment-initiate → complete/reject
- [ ] `/farmer/procurement` → shows lifecycle status + weighing details
- [ ] `/farmer/payment` → shows linked payments
- [ ] `/admin/reports` → operational summary + dashboard totals
- [ ] `/admin/audit` → filter/search audit logs
- [ ] Mobile (≤768px): hamburger menu works; grids collapse; forms readable
- [ ] `/unknown-route` → 404 page

---

## Project Structure (Complete)

```
AgriFlow/
├── .env.example
├── .gitignore
├── package.json
├── README.md
│
├── backend/
│   ├── .env
│   ├── server.js
│   ├── seeder.js
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── middleware/error.js
│   ├── models/
│   │   ├── User.js / Farmer.js / Centre.js / Appointment.js / BookingSlot.js
│   │   ├── Queue.js / DailyCounter.js / Procurement.js / Payment.js
│   │   ├── Notification.js / AuditLog.js
│   ├── routes/
│   │   ├── authRoutes.js / appointmentRoutes.js / queueRoutes.js
│   │   ├── centreRoutes.js / procurementRoutes.js / paymentRoutes.js
│   │   ├── notificationRoutes.js / auditRoutes.js / farmerRoutes.js / adminRoutes.js
│   └── utils/ (queueHelpers.js, generateToken.js)
│
└── frontend/
    ├── vite.config.js (proxy /api + /socket.io)
    ├── index.html
    └── src/
        ├── App.jsx (all routes + protected)
        ├── components/
        │   ├── Navbar.jsx / AppLayout.jsx / ProtectedRoute.jsx
        │   ├── Button.jsx / Card.jsx / Form.jsx / StatusBadge.jsx
        │   ├── Spinner.jsx / ErrorState.jsx / PageHeader.jsx
        ├── pages/
        │   ├── farmer/ (Dashboard, Profile, Centres, BookAppointment,
        │   │     Appointments, Queue, Procurement, Payment, Notifications)
        │   └── admin/ (Dashboard, Centres, Queue, Farmers, Users,
        │       Procurements, Payments, Notifications, AuditLogs, Reports)
        ├── services/ (api.js, socket.js)
        └── styles/ (theme.css, global.css, PageStyles.css)
```

---

## Roadmap (Completed — All 15 Phases)

- **Phase 1**: Auth + basic layout
- **Phase 2**: Appointment booking + capacity
- **Phase 3**: Queue + Socket.IO
- **Phase 4**: Centre management
- **Phase 5**: Notifications
- **Phase 6**: Queue check-in + real-time
- **Phase 7**: Procurement lifecycle
- **Phase 8**: Payment tracking
- **Phase 9**: Event-driven notifications (Socket.IO user rooms)
- **Phase 10**: Audit logs + operational reports
- **Phase 11**: Complete farmer experience
- **Phase 12**: Complete admin/operational dashboard
- **Phase 13**: Security, validation, edge cases
- **Phase 14**: UI/UX polish + responsive design
- **Phase 15**: Production readiness + final verification (this phase)
