export interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url?: string;
  location: string; // e.g., "Remote (Worldwide)", "Remote (US)"
  workplace_type?: 'remote' | 'hybrid' | 'onsite';
  location_lat?: number;
  location_lng?: number;
  location_place_id?: string;
  type: 'full-time' | 'part-time' | 'contract' | 'freelance';
  salary_range?: string;
  posted_at: string;
  tags: string[];
  application_url?: string;
  // Detailed fields
  description?: string;
  requirements?: string[];
  benefits?: string[];
}
