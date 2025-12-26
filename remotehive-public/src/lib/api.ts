import { getSupabase } from "./supabase";
import { storage, APPWRITE_BUCKET_ID, ID } from "./appwrite";
import { Job } from "../types";

export const BASE_URL = "http://localhost:8000";

export async function getHealth(): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getJobs(filters?: {
  keyword?: string;
  role?: string;
  location?: string;
  type?: string;
  companyId?: string;
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
      application_url,
      company:companies(name, logo_url)
    `)
    .eq('status', 'active')
    .order('posted_at', { ascending: false });

  if (filters?.keyword) {
    // Search in title or company name
    // Note: Supabase doesn't support OR across joined tables easily in one filter string
    // We'll search title for now, or improve with a function later
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
  
  // Role filtering is tricky with tags array, simplified for now
  if (filters?.role) {
    query = query.contains('tags', [filters.role]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }

  // Map database response to Job interface
  return data.map((job: any) => ({
    id: job.id,
    title: job.title,
    company_name: job.company?.name || 'Unknown Company',
    company_logo_url: job.company?.logo_url,
    location: job.location,
    type: job.type,
    salary_range: job.salary_range,
    posted_at: job.posted_at,
    tags: job.tags || [],
    application_url: job.application_url
  }));
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
      company:companies(name, logo_url, website_url, description)
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
