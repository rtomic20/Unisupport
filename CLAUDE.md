# Unisupport — CLAUDE.md

## Što je ovaj projekt

Web aplikacija za upravljanje studentskim zahtjevima (prijevoz i usluge). Tri uloge: admin, student, vozač/driver.

## Stack

- **Frontend**: React 19 + TypeScript + Tailwind v4 + Vite, port **4200**
- **Backend**: Django 5.1 + DRF + simplejwt, port **8000**
- **DB**: PostgreSQL 16, port **5433** (ne 5432 — izbjegnuto sudara)
- **Pokretanje**: Docker Compose

## Pokretanje lokalnog okruženja

```bash
cd C:\Users\Korisnik\Desktop\Unisupport
docker-compose up --build
```

Frontend: http://localhost:4200  
Backend API: http://localhost:8000/api  
Django Admin: http://localhost:8000/admin

## Inicijalni podaci (seed)

Seed se izvršava automatski pri pokretanju (`entrypoint.py` → `seed_initial_data`).

| Email | Lozinka | Uloga |
|-------|---------|-------|
| admin@unisupport.local | admin123 | admin |

Admin kreira ostale korisnike (studente i vozače) kroz UI ili Django admin.

## Struktura projekta

```
backend/
  config/settings/       # base.py + development.py
  apps/
    accounts/            # Role, CustomUser, JWT, permissions
    requests_app/        # Request, TransportDetails, ServiceDetails + reports
frontend/
  src/
    api/axios.ts         # Axios instance + JWT interceptor
    contexts/AuthContext.tsx  # JWT decode + login/logout
    pages/admin/         # AdminDashboard, UsersPage, RolesPage, RequestsPage, ReportsPage
    pages/student/       # StudentDashboard, NewRequestPage
    pages/driver/        # DriverDashboard, MyRidesPage
```

## DB tablice (točno prema ER modelu)

| Tablica | Opis |
|---------|------|
| `roles` | role_id, role_name |
| `users` | user_id, first/last_name, email, phone, role_id FK |
| `requests` | request_id, student_id FK, request_type, request_date, start/end_time, status, description, accepted_by_user_id FK, created_at, accepted_at |
| `transport_details` | request_id PK+FK, pickup_address, dropoff_address |
| `service_details` | request_id PK+FK, service_category, location |

## API endpoints (prefiks: /api)

### Auth
- `POST /auth/token/` — login → access+refresh JWT
- `POST /auth/token/refresh/`
- `GET  /auth/me/` — profil

### Users & Roles (admin only)
- `GET/POST  /accounts/users/` + `?role=driver`
- `GET/PATCH/DELETE /accounts/users/<id>/`
- `GET/POST  /accounts/roles/`
- `GET/PATCH/DELETE /accounts/roles/<id>/`

### Requests
- `GET  /requests/` — filteri: `?type=transport`, `?status=pending`, `?date=YYYY-MM-DD`, `?month=YYYY-MM`
- `POST /requests/` — payload s nested `transport_details` ili `service_details`
- `GET/PATCH/DELETE /requests/<id>/`
- `POST /requests/<id>/accept/`
- `POST /requests/<id>/reject/`
- `POST /requests/<id>/complete/`
- `POST /requests/<id>/assign_driver/` — body: `{driver_id: X}`

### Reports (admin only)
- `GET /reports/rides-per-user/` + `?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /reports/rides-per-driver/`

## Uloge i pristup

| Uloga | Može |
|-------|------|
| admin | Sve — CRUD korisnici/uloge, svi zahtjevi, dodjela vozača, izvještaji |
| student | Kreira zahtjeve, vidi samo svoje |
| driver | Vidi pending transport zahtjeve, prihvaća, završava, vidi svoje vožnje |

## Dev napomene

- **Entrypoint je Python** (`entrypoint.py`), ne shell — zbog Windows CRLF problema na Docker volume mountu
- `frontend/.dockerignore` isključuje `node_modules` — kritično za build na Windows hostu
- CORS: `CORS_ALLOW_ALL_ORIGINS=True` samo u `development.py`
- JWT token nosi `role`, `first_name`, `last_name`, `user_id` — dekodira se u `AuthContext.tsx`
- `request_type` u DB-u određuje koja detalj tablica se koristi (`transport_details` vs `service_details`)
- `accepted_by_user_id` je NULL dok zahtjev nije prihvaćen/dodijeljen

## Migracije

```bash
docker exec unisupport-backend-1 python manage.py makemigrations
docker exec unisupport-backend-1 python manage.py migrate
```
