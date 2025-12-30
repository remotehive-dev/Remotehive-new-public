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
  job_reference_id?: string;
  application_method?: 'external' | 'internal';
  company?: Company;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  description?: string;
  location?: string;
  tags?: string[];
  rating?: number;
  review_count?: number;
  size?: string;
  founded?: string;
  industry?: string;
  type?: string;
}
