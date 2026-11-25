# Railway Deployment Guide for AUN Club Management System

This project is prepared for single-click / modular deployment on [Railway](https://railway.com).

The system consists of **3 Services** on Railway:
1. **MySQL Database** (Railway managed plugin)
2. **Backend API** (FastAPI Python container)
3. **Frontend SPA** (React + Nginx container)

---

## Step-by-Step Deployment Instructions

### 1. Create a New Project on Railway
1. Log in to [Railway](https://railway.com).
2. Click **"New Project"** -> Select **"Provision MySQL"**.
3. Railway will provision a managed MySQL instance with all credentials automatically created.

### 2. Deploy the Backend Service
1. In the same project canvas, click **"+ Create"** -> **"GitHub Repo"**.
2. Select your repository: `Oladinno/CLUBMANAGEMENTSYSTEM`.
3. In the service settings:
   - **Root Directory**: leave as `/` (or set Dockerfile path to `backend/Dockerfile`).
   - Click **"Variables"** and add:
     - `DATABASE_URL`: `${{MySQL.MYSQL_URL}}` *(Railway variable reference to your MySQL database)*
     - `SECRET_KEY`: `generate-a-random-secure-string-here`
     - `PROJECT_NAME`: `AUN Club & Student Organization Management System`
4. Under **"Settings"** -> **"Networking"**, click **"Generate Domain"** (e.g., `aun-backend-production.up.railway.app`).
5. Copy this generated backend URL.

### 3. Deploy the Frontend Service
1. On the same canvas, click **"+ Create"** -> **"GitHub Repo"** again -> select `Oladinno/CLUBMANAGEMENTSYSTEM`.
2. Under **"Settings"**:
   - **Build**: Select `frontend/Dockerfile` as the Dockerfile path.
3. Under **"Variables"**:
   - `VITE_API_URL`: `https://<YOUR-BACKEND-DOMAIN>/api/v1` *(e.g. `https://aun-backend-production.up.railway.app/api/v1`)*
4. Under **"Settings"** -> **"Networking"**, click **"Generate Domain"** (e.g. `aun-clubs.up.railway.app`).

---

## 4. Initial Database Seeding
The backend startup automatically runs `python backend/seed.py` on first launch, which populates:
- 2 Academic Sessions
- 5 Categories (Academic, Sports, Arts, etc.)
- 3 Pre-configured Clubs
- Demo personas:
  - **Admin**: `admin@aun.edu.ng` / `Admin123!`
  - **Executive**: `tunde.adebayo@aun.edu.ng` / `Student123!`
  - **Student**: `chidi.okonkwo@aun.edu.ng` / `Student123!`

---

## 5. Verification
- Open your frontend Railway domain in any browser:
  - You can sign in using any of the demo personas.
  - Test QR code generation, check-in, club applications, and PDF transcripts.
