import { getSupabase } from "./supabase";
import { storage, APPWRITE_BUCKET_ID, ID } from "./appwrite";
import { Job } from "../types";

export const BASE_URL = "http://localhost:8000";
export const DJANGO_API_URL = "http://localhost:8001";

export async function getHealth(): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface SEOConfig {
  global_tags: Array<{ name: string; content: string; location: string }>;
  pages: Record<string, {
    title: string;
    description: string;
    keywords?: string;
    og_image?: string;
    canonical_url?: string;
    no_index?: boolean;
  }>;
  marketing: Array<{
    name: string;
    provider: string;
    pixel_id?: string;
    script_content?: string;
  }>;
}

export async function fetchSEOConfig(): Promise<SEOConfig | null> {
  try {
    const res = await fetch(`${DJANGO_API_URL}/api/seo-config/`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch SEO config:", error);
    return null;
  }
}

export interface CompanyCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  count: number;
  sample_logos: string[];
  subcategories: Array<{
    id: number;
    name: string;
    slug: string;
    count: number;
  }>;
}

export async function getCompanyCategories(): Promise<CompanyCategory[]> {
  try {
    const res = await fetch(`${DJANGO_API_URL}/api/company-categories/`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch company categories:", error);
    return [];
  }
}

export async function getJobs(filters?: {
  keyword?: string;
  role?: string;
  location?: string;
  type?: string;
  companyId?: string;
  company_name?: string;
  tenure?: string;
  salary_min?: number;
  date_posted?: '24h' | '7d' | '30d' | 'all';
}): Promise<Job[]> {
  const supabase = getSupabase();
  let query = supabase
    .from('jobs')
    .select(`
      id,
      title,
      location,
      type,
      salary_range,
      posted_at,
      tags,
      description,
      application_url,
      company:companies(id, name, logo_url, website_url, description)
    `)
    .in('status', ['active', 'approved', 'published'])
    .order('posted_at', { ascending: false });

  if (filters?.keyword) {
    query = query.ilike('title', `%${filters.keyword}%`);
  }

  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  if (filters?.companyId) {
    query = query.eq('company_id', filters.companyId);
  }

  // Role filtering 
  if (filters?.role) {
    // Check if role is in tags OR title matches
    query = query.or(`title.ilike.%${filters.role}%,tags.cs.{${filters.role}}`);
  }

  if (filters?.date_posted && filters.date_posted !== 'all') {
    const now = new Date();
    let pastDate = new Date();
    
    if (filters.date_posted === '24h') {
      pastDate.setDate(now.getDate() - 1);
    } else if (filters.date_posted === '7d') {
      pastDate.setDate(now.getDate() - 7);
    } else if (filters.date_posted === '30d') {
      pastDate.setDate(now.getDate() - 30);
    }
    
    query = query.gte('posted_at', pastDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }

  // Map database response to Job interface
  let jobs = data.map((job: any) => ({
    id: job.id,
    title: job.title,
    company_name: job.company?.name || 'Unknown Company',
    company_logo_url: job.company?.logo_url,
    company: job.company, // Pass full company object
    location: job.location,
    type: job.type,
    salary_range: job.salary_range,
    posted_at: job.posted_at,
    tags: job.tags || [],
    description: job.description,
    application_url: job.application_url
  })) as Job[];

  // Client-side filtering for complex fields

  // 1. Company Name Filter
  if (filters?.company_name) {
    jobs = jobs.filter(job =>
      job.company_name.toLowerCase().includes(filters.company_name!.toLowerCase())
    );
  }

  // 2. Tenure Filter (Approximation)
  if (filters?.tenure) {
    const tenure = filters.tenure.toLowerCase();
    jobs = jobs.filter(job => {
      const text = (job.title + ' ' + (job.tags || []).join(' ')).toLowerCase();
      if (tenure === 'entry' || tenure === 'junior') return text.includes('junior') || text.includes('entry') || text.includes('intern') || text.includes('associate');
      if (tenure === 'senior') return text.includes('senior') || text.includes('lead') || text.includes('principal') || text.includes('staff');
      if (tenure === 'manager') return text.includes('manager') || text.includes('head') || text.includes('director') || text.includes('vp');
      if (tenure === 'mid') return !text.includes('senior') && !text.includes('lead') && !text.includes('junior') && !text.includes('intern') && !text.includes('manager');
      return true;
    });
  }

  // 3. Salary Filter (Basic Parsing)
  if (filters?.salary_min) {
    jobs = jobs.filter(job => {
      if (!job.salary_range) return false;
      // Extract number from string like "$100k - $120k"
      const matches = job.salary_range.match(/(\d+)/);
      if (!matches) return false;

      let amount = parseInt(matches[0]);
      // Heuristic: if number is small (e.g. 100), assume 'k'
      if (amount < 1000 && job.salary_range.toLowerCase().includes('k')) {
        amount *= 1000;
      } else if (amount < 1000) {
        // If just "50-60", likely "k" is implied in context or it is hourly? 
        // Safest to assume annual 'k' for most checks if < 500
        amount *= 1000;
      }

      return amount >= filters.salary_min!;
    });
  }

  return jobs;
}

export async function getJob(id: string): Promise<Job | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      location,
      type,
      workplace_type,
      location_lat,
      location_lng,
      location_place_id,
      salary_range,
      posted_at,
      tags,
      application_url,
      description,
      requirements,
      benefits,
      company:companies(id, name, logo_url, website_url, description)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching job:', error);
    return null;
  }

  // Use explicit casting to any to bypass the 'never' type inference issue with Supabase types
  const jobData = data as any;

  return {
    id: jobData.id,
    title: jobData.title,
    company_name: jobData.company?.name || 'Unknown Company',
    company_logo_url: jobData.company?.logo_url,
    company: jobData.company, // Pass the full company object
    location: jobData.location,
    type: jobData.type,
    salary_range: jobData.salary_range,
    posted_at: jobData.posted_at,
    tags: jobData.tags || [],
    application_url: jobData.application_url,
    description: jobData.description,
    requirements: jobData.requirements,
    benefits: jobData.benefits,
    job_reference_id: jobData.job_reference_id,
    application_method: jobData.application_method
  } as Job;
}

export async function getCompanies() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching companies:', error);
    return [];
  }

  return data;
}

export async function getCompany(id: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching company:', error);
    return null;
  }

  return data;
}

export async function uploadResume(userId: string, file: File, token?: string, provider: 'supabase' | 'appwrite' = 'supabase') {
  const supabase = getSupabase(token);
  let publicUrl = "";

  if (provider === 'appwrite') {
    if (!APPWRITE_BUCKET_ID) {
      throw new Error("Appwrite bucket ID is not configured");
    }
    try {
      const fileId = ID.unique();
      const result = await storage.createFile(
        APPWRITE_BUCKET_ID,
        fileId,
        file
      );
      // Get View URL (for viewing in browser)
      publicUrl = storage.getFileView(APPWRITE_BUCKET_ID, result.$id);
    } catch (error: any) {
      console.error("Appwrite upload error:", error);
      throw new Error(`Appwrite upload failed: ${error.message}`);
    }
  } else {
    // Supabase Upload
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('Jobseeker-Resume')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from('Jobseeker-Resume')
      .getPublicUrl(filePath);

    publicUrl = data.publicUrl;
  }

  // Update user profile with resume URL (works for both providers)
  const { error: updateError } = await supabase
    .from('users')
    .update({ resume_url: publicUrl } as any)
    .eq('clerk_id', userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return publicUrl;
}

export interface UserProfile {
  clerk_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string; // Keep for backward compatibility/display
  role: 'employer' | 'jobseeker';
  headline?: string;
  bio?: string;
  skills?: string[];
  experience_level?: string;
  resume_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  phone?: string;
  phone_country_code?: string;
  phone_verified?: boolean;
  // Detailed Location
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;

  work_experience?: any[];
  education?: any[];
  projects?: any[];
  job_preferences?: any;
  interests?: string[];
}

export async function createUser(userData: UserProfile, token?: string) {
  const supabase = getSupabase(token);

  const { data, error } = await supabase
    .from('users')
    .insert([userData] as any)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCandidates(filters?: {
  skill?: string;
  location?: string;
  experience_level?: string;
  name?: string;
}) {
  const supabase = getSupabase();
  let query = supabase
    .from('users')
    .select(`
      id,
      clerk_id,
      first_name,
      last_name,
      full_name,
      headline,
      bio,
      skills,
      experience_level,
      city,
      country,
      resume_url,
      linkedin_url,
      portfolio_url
    `)
    .eq('role', 'jobseeker');

  if (filters?.skill) {
    query = query.contains('skills', [filters.skill]);
  }

  if (filters?.location) {
    // Search in city or country
    // Supabase ilike doesn't support OR efficiently in query builder chain without .or()
    // Simple approach: filter by city OR country
    query = query.or(`city.ilike.%${filters.location}%,country.ilike.%${filters.location}%`);
  }

  if (filters?.experience_level) {
    query = query.eq('experience_level', filters.experience_level);
  }

  if (filters?.name) {
    query = query.ilike('full_name', `%${filters.name}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching candidates:', error);
    return [];
  }

  return data;
}

export async function updateUser(clerkId: string, updates: Partial<UserProfile>, token?: string) {
  const supabase = getSupabase(token);

  const { data, error } = await supabase
    .from('users')
    .update(updates as any)
    .eq('clerk_id', clerkId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getUserByClerkId(clerkId: string, token?: string) {
  const supabase = getSupabase(token);

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
