# Step 8: Appwrite Storage & Resume Templates

## Goal
- Integrate Appwrite Storage for scalable file handling.
- Enable dual-storage strategy (Supabase for data, Appwrite for files).
- Implement dynamic Resume Template loading.

## Configuration
- **Appwrite Endpoint**: `https://cloud.appwrite.io/v1`
- **Project ID**: `YOUR_PROJECT_ID`
- **Buckets**:
  - `Jobseeker-Resume`: Stores candidate PDF uploads.
  - `Resume-Templates`: Stores template preview images and assets.

## Implementation Details

### 1. Appwrite SDK (`src/lib/appwrite.ts`)
- Initialized `Client`, `Storage`, `Account`, and `Databases`.
- Added ping verification on app load.

### 2. Dual Storage Logic (`src/lib/api.ts`)
- Updated `uploadResume` to support a `provider` argument (`'supabase' | 'appwrite'`).
- UI Toggle added to Profile Page to switch providers instantly.

### 3. Dynamic Templates (`src/lib/templates.ts`)
- Created a service to fetch template metadata from Appwrite Storage.
- Implemented robust fallback to local templates if remote fetch fails (e.g., unauthenticated).

## Resume Builder Enhancements
- **Drag-and-Drop Sections**: Users can reorder resume sections freely.
- **Data Portability**: Added JSON Import/Export to save resume state + settings.
- **PDF Rendering**: Fixed `react-pdf` compatibility issues with React 19.

## Next
- Grant Public Read permissions to Appwrite buckets to enable dynamic template fetching for guests.
- Upload template assets to the `Resume-Templates` bucket.
