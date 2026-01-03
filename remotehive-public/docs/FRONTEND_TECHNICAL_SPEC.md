# Frontend Technical Specification & API Requirements

**Date:** 2025-12-15
**Version:** 1.1
**Project:** RemoteHive Public Website

## 1. Overview
This document outlines the current state of the RemoteHive public frontend, the data models it relies on, and the API endpoints required to make it fully dynamic. It serves as a contract for the backend implementation (Supabase).

## 2. Frontend Pages & Features

### 2.1 Home Page (`/`)
*   **Hero Section**:
    *   **Search Bar**: Inputs for Keyword, Role (Dropdown), Location (Dropdown).
    *   **Quick Filters**: Clickable chips (e.g., "Remote", "MNC", "Engineering") linking to filtered Job feeds.
    *   **Stats**: 4 Key Metrics (Active Jobs, Companies, Success Rate, Countries).
*   **Top Companies Hiring Now**:
    *   Horizontal scrollable list of "Collections" (e.g., MNCs, Fintech).
    *   Displays collection name, active hiring count, and 4 sample logos.
*   **Featured Roles**:
    *   Grid of popular roles (e.g., "Full Stack Developer") with job counts.

### 2.2 Jobs Page (`/jobs`)
*   **Purpose**: Main feed for browsing job listings.
*   **Functionality**:
    *   Accepts URL query parameters: `keyword`, `role`, `location`, `type`.
    *   **Filters Sidebar** (Planned): To toggle these parameters interactively.
    *   **Job List**: Displays `JobCard` components in a responsive grid.
*   **Data Requirements**: List of jobs matching criteria, Total count.

### 2.3 Companies Page (`/companies`)
*   **Purpose**: Directory of companies hiring on the platform.
*   **Layout**: Split view (Sidebar Filters + Company Grid).
*   **Header**: "Top Collections" horizontal scroll (similar to Home Page).
*   **Sidebar Filters**:
    *   **Company Type**: Corporate, MNC, Startup, etc.
    *   **Location**: Searchable list + Checkboxes.
*   **Company Grid**: Displays `CompanyCard` with Logo, Name, Rating, Review Count, Tags.

### 2.4 Pricing Page (`/pricing`)
*   **Purpose**: Employer subscription plans.
*   **Content**: Static pricing table (Standard, Premium, Enterprise) in INR.
*   **Action**: Redirects to Clerk Auth (`/sign-in?type=employer`).

### 2.5 Authentication (Clerk)
*   **Flow**: Two distinct user types: `jobseeker` and `employer`.
*   **Status**: Mock implementation (`AuthComponents.tsx`) active until `VITE_CLERK_PUBLISHABLE_KEY` is provided.

### 2.6 Onboarding & Profile (`/onboarding`, `/dashboard/profile`)
*   **Flow**: 4-Step Neumorphic Wizard:
    1.  **Profile Details**: Basic contact info.
    2.  **Work History**: Experience details.
    3.  **Skills & Summary**: Professional identity.
    4.  **Interests**: Job type and field preferences.
*   **Profile Scoring**:
    *   Weighted calculation based on filled fields.
    *   **Alerts**: Visual warning if score < 20%.
    *   **Mandatory Checks**: Blocks job applications if critical fields are missing.
*   **Resume Parsing (AI)**:
    *   **Model**: OpenRouter (GPT-OSS-20B).
    *   **Feature**: Auto-fills profile from PDF resume.

### 2.7 UI/UX Design System
*   **Theme**: Glassmorphism with Pastel Gradient.
*   **Background**: Linear Gradient (`#EAD6EE` to `#A0F1EA`).
*   **Components**: Semi-transparent white containers (`bg-white/40`) with `backdrop-filter: blur()`.
*   **Typography**: Dark Gray (`#333333`) for contrast.
*   **Shadows**: Soft, light shadows for depth without harsh contrast.

---

## 3. Data Models (TypeScript Interfaces)

### 3.1 Job
```typescript
interface Job {
  id: string;
  title: string;
  company_name: string; // Relation to Company.name
  company_logo_url?: string; // Relation to Company.logo_url
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance';
  salary_range?: string;
  posted_at: string; // ISO Date
  tags: string[]; // e.g., ["React", "Engineering"]
  application_url?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
}
```

### 3.2 Company
```typescript
interface Company {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
  description?: string;
  rating?: number; // e.g., 4.2
  review_count?: number;
  tags: string[]; // e.g., ["MNC", "Fintech"]
  type: 'Corporate' | 'MNC' | 'Startup';
  locations: string[]; // e.g., ["Bangalore", "Mumbai"]
}
```

### 3.3 UserProfile (Extended)
```typescript
interface UserProfile {
  clerk_id: string;
  email: string;
  full_name: string;
  role: 'employer' | 'jobseeker';
  headline?: string;
  bio?: string;
  skills?: string[];
  experience_level?: string;
  resume_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  phone?: string;
  city?: string;
  country?: string;
  work_experience?: any[];
  education?: any[];
  projects?: any[];
  interests?: string[]; // New
  job_preferences?: { // New
    types: string[];
    remote_only: boolean;
  };
}
```

---

## 4. Required API Endpoints (Supabase / Edge Functions)

### 4.1 Jobs API
| Endpoint | Method | Params | Description |
| :--- | :--- | :--- | :--- |
| `/rest/v1/jobs` | `GET` | `title`, `company_name`, `tags`, `location` | Search jobs with filters. Support pagination (`offset`, `limit`). |
| `/rest/v1/jobs/:id` | `GET` | - | Get full details of a single job. |

### 4.2 Companies API
| Endpoint | Method | Params | Description |
| :--- | :--- | :--- | :--- |
| `/rest/v1/companies` | `GET` | `type`, `location`, `name` | Search companies. |
| `/rest/v1/companies/:id` | `GET` | - | Get company profile + active jobs list. |

### 4.3 Aggregations & Stats (Home Page)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/rpc/get_homepage_stats` | `POST` | Returns `{ active_jobs, companies_count, ... }` |
| `/rpc/get_top_collections` | `POST` | Returns list of collections with aggregated hiring counts. |
| `/rpc/get_featured_roles` | `POST` | Returns list of roles with job counts (e.g., `Full Stack: 2300`). |

---

## 5. Next Steps for Implementation
1.  **Database Schema**: Create tables (`jobs`, `companies`, `users`) in Supabase.
2.  **Seeding**: Populate tables with the mock data currently used in React components.
3.  **Client Integration**: Replace `MOCK_JOBS` and `COMPANIES` arrays in `.tsx` files with `supabase.from('...').select(...)` calls.
