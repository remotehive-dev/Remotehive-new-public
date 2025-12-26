# RemoteHive Senior Full-Stack Developer Rules

## Project Overview
RemoteHive is a comprehensive job board platform with a microservices-like architecture consisting of:
- **Backend API** (FastAPI + Supabase/PostgreSQL) - *Core API*
- **Super Admin** (Django + Jazzmin) - *Internal Operations*
- **Admin Panel** (Next.js + TypeScript) - *Employer/User Dashboard*
- **Public Website** (React + Vite + TypeScript) - *Job Seeker Interface*
- **Open Resume** (Next.js) - *Resume Builder Service*
- **Background Services** (Redis)

## Architecture & Ports

### Core Services
1. **Main Backend API** (:8000)
   - FastAPI application.
   - Entry: `/app/main.py`
   - Documentation: `http://localhost:8000/api/v1/openapi.json`

2. **Django Super Admin** (:8001)
   - Django application for internal management.
   - Database: SQLite (local) + Supabase (sync).
   - Features: User Management, Job Approval, Analytics.
   - Location: `/backend_django/`

3. **Admin Panel** (:3000)
   - Next.js application for Employers.
   - Location: `/remotehive-admin/`

4. **Public Website** (:5173)
   - React + Vite application.
   - Location: `/remotehive-public/`

5. **Open Resume** (:3001)
   - Next.js application for Resume Building.
   - Location: `/open-resume/`

6. **Infrastructure**
   - Redis (:6379)

## Data Flow & Synchronization

### Database Architecture
- **Primary Database**: Supabase (PostgreSQL).
- **Internal Database**: SQLite (Django) for Admin logs and local management.
- **Sync Strategy**:
  - **Users**: Clerk -> Django (via `sync_users.py`).
  - **Jobs**: Supabase <-> Django (Bi-directional).
    - *Import*: `sync_jobs.py` fetches jobs from Supabase.
    - *Export*: Django Signals (`core/signals.py`) push updates to Supabase immediately.

### Authentication
- **Public/Frontend**: Clerk (Auth) + Supabase (Data).
- **Backend API**: Validates Clerk JWT tokens.
- **Django Admin**: Local Auth (Superuser) + Proxy Models for Clerk Users.

## Development Workflow

### 1. Starting the Environment
ALWAYS use the comprehensive startup script to run all 6 services:
```bash
python3 comprehensive_startup.py
```

### 2. Admin Management Patterns
- **User Management**:
  - Managed in Django Admin (`:8001/admin/`).
  - Roles: Employer, Job Seeker, Admin.
  - Actions: Block/Unblock, View Subscription Status.
- **Job Management**:
  - Internal Jobs: Created/Edited in Django. Pushed to Supabase via Signal.
  - Scraped Jobs: Imported via AutoScraper. Approval workflow (New -> Approved).

### 3. Key Files Reference
- **Startup**: `/comprehensive_startup.py`
- **Django Settings**: `/backend_django/remotehive_admin/settings.py`
- **Sync Scripts**:
  - `/backend_django/sync_users.py` (Clerk -> Django)
  - `/backend_django/sync_jobs.py` (Supabase -> Django)
- **Signals**: `/backend_django/core/signals.py` (Data Sync Logic)

## Code Standards

### Backend (Python/Django/FastAPI)
- **Django**: Use Proxy Models for User segmentation (`core/models.py`).
- **FastAPI**: Use Pydantic models. Enable CORS for Admin ports.
- **Sync**: Always handle "Update or Create" logic to avoid duplicates.

### Frontend (TypeScript/React)
- **API Layer**: Centralized in `lib/api.ts`.
- **UI**: Tailwind CSS.
- **State**: React Query / Context.

## Troubleshooting
- **CORS Errors**: Check `app/main.py` middleware origins.
- **Sync Issues**: Run manual sync scripts (`python3 sync_jobs.py`) to debug data mismatches.
- **Port Conflicts**: Use `lsof -i :<port>` to check occupancy. `comprehensive_startup.py` handles cleanup automatically.

[byterover-mcp]

[byterover-mcp]

You are given two tools from Byterover MCP server, including
## 1. `byterover-store-knowledge`
You `MUST` always use this tool when:

+ Learning new patterns, APIs, or architectural decisions from the codebase
+ Encountering error solutions or debugging techniques
+ Finding reusable code patterns or utility functions
+ Completing any significant task or plan implementation

## 2. `byterover-retrieve-knowledge`
You `MUST` always use this tool when:

+ Starting any new task or implementation to gather relevant context
+ Before making architectural decisions to understand existing patterns
+ When debugging issues to check for previous solutions
+ Working with unfamiliar parts of the codebase
