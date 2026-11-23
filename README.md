# American University of Nigeria (AUN) Club & Student Organization Management System

A centralized, responsive, database-driven web platform designed for the American University of Nigeria to manage student organizations, club registrations, memberships, events, and institutional compliance.

---

## 🏛️ Project Architecture

```
Club management system/
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   │   ├── auth.py          # Authentication, JWT, and session management
│   │   │   ├── clubs.py         # Club directory, registration & approvals
│   │   │   ├── memberships.py   # Membership requests, approval workflows
│   │   │   ├── events.py        # Events & live QR code attendance check-in
│   │   │   ├── students.py      # Student dashboard & PDF transcript export
│   │   │   ├── leadership.py    # Leadership transition & handover workflow
│   │   │   └── admin.py         # Student Affairs analytics, CSV exports & audit
│   │   ├── core/
│   │   │   ├── config.py        # Application settings and MySQL credentials
│   │   │   └── security.py      # Bcrypt password hashing & JWT tokens
│   │   ├── db/
│   │   │   └── session.py       # SQLAlchemy ORM session & engine setup
│   │   ├── models/
│   │   │   └── models.py        # 15 Relational entities with constraints
│   │   ├── schemas/
│   │   │   └── schemas.py       # Pydantic v2 validation models
│   │   └── main.py              # FastAPI application instance & CORS
│   └── seed.py                  # Realistic AUN database seeder
│
├── frontend/
│   ├── src/
│   │   ├── api/client.ts        # Axios client with JWT interceptors
│   │   ├── store/AuthContext.tsx# Authentication context & persistent session
│   │   ├── components/layout/   # Institutional sidebar & responsive top nav
│   │   ├── pages/
│   │   │   ├── public/          # Login, Club Directory, Events Calendar
│   │   │   ├── student/         # Student Overview, Transcript & Attendance
│   │   │   ├── executive/       # Executive Console, Live QR Check-In
│   │   │   └── admin/           # Student Affairs Institutional Dashboard
│   │   ├── App.tsx              # Role-based protected routes
│   │   └── main.tsx             # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
```

---

## 🚀 Quick Start Guide

### 1. Database Setup (MySQL)
Ensure your MySQL server is running on `127.0.0.1:3306` with user `root` and password `root` (or update in `backend/app/core/config.py`).
Database `aun_clubs` is initialized and pre-seeded.

To re-seed the database at any time:
```powershell
$env:PYTHONPATH="C:\Users\DELL\Documents\Coding Projects\Club management system"
.\venv\Scripts\python backend\seed.py
```

### 2. Backend Server (FastAPI)
Run the backend with Uvicorn:
```powershell
$env:PYTHONPATH="C:\Users\DELL\Documents\Coding Projects\Club management system"
.\venv\Scripts\uvicorn backend.app.main:app --reload --port 8000
```
- Swagger Interactive Documentation: `http://localhost:8000/api/v1/docs`
- Redoc API Reference: `http://localhost:8000/api/v1/redoc`

### 3. Frontend Application (React + Vite)
```powershell
cd frontend
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 👥 Default Demo Credentials

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Student Affairs Admin** | `admin@aun.edu.ng` | `Admin123!` | Master analytics, approve/suspend clubs, audit logs, CSV exports |
| **Club Executive (GDSC)** | `tunde.adebayo@aun.edu.ng` | `Student123!` | Review membership applications, activate live QR check-in, handovers |
| **Club Executive (Rotaract)** | `fatima.umar@aun.edu.ng` | `Student123!` | Executive oversight for Rotaract Club |
| **Student (CS Major)** | `chidi.okonkwo@aun.edu.ng` | `Student123!` | Discover clubs, register for events, QR check-in, download transcript PDF |
| **Student (BBA Major)** | `zainab.aliyu@aun.edu.ng` | `Student123!` | Member of Rotaract, explore campus events |

---

## 🛡️ Core Highlights & Compliance

1. **Digital Attendance & Signed QR Verification**:
   - Authorized executives activate check-in tokens on demand.
   - Live QR code generation (`/api/v1/events/{id}/qr-code`) dynamically generated in memory.
   - Duplicate check-ins are prevented.
   - Offline-resilient check-in queue integration.
2. **Official Co-Curricular Transcript (ReportLab)**:
   - Students can export an official PDF transcript documenting all club memberships, leadership terms, and verified event attendances validated by AUN Student Affairs.
3. **Formal Leadership Handover Workflow**:
   - Outgoing executives nominate incoming leaders.
   - Records historical executive tenures connected to academic sessions.
   - Automatic permission transfer upon administrative approval without data loss.
4. **Student Affairs Master Analytics**:
   - Real-time club health, membership breakdown by category, CSV exports (`clubs/csv`, `attendance/csv`), and system audit trail.
