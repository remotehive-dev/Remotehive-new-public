import { getSupabase } from "./supabase";

export interface JobPost {
  title: string;
  type: string;
  location: string;
  workplace_type?: 'remote' | 'hybrid' | 'onsite';
  location_lat?: number;
  location_lng?: number;
  location_place_id?: string;
  salary_range: string;
  description: string;
  requirements: string[];
  benefits: string[];
  company_id: string;
  slug: string;
  application_url?: string;
  source?: 'employer' | 'scraper';
}

export interface CompanyProfile {
  name: string;
  website_url: string;
  logo_url: string;
  description: string;
  type: string;
  locations: string[];
  tags: string[];
  slug?: string;
  // Enhanced fields
  domain_verified?: boolean;
  sso_enabled?: boolean;
  sso_config?: {
    provider: string;
    entry_point: string;
    cert: string;
    issuer: string;
  };
}

export interface DashboardStats {
  stats: {
    name: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: string;
  }[];
  recentJobs: {
    id: string; // Add ID to recentJobs
    title: string;
    type: string;
    posted: string;
    applicants: number;
    status: string;
    location: string;
    salary: string;
  }[];
}

export async function getDashboardStats(companyId: string): Promise<DashboardStats> {
  const supabase = getSupabase();

  // Note: views_count and applications_count are currently not in Supabase schema
  const { data, error } = await supabase
    .from('jobs')
    .select('id, status, title, posted_at, type, location, salary_range') 
    .eq('company_id', companyId);

  if (error) {
    throw new Error(error.message);
  }

  const jobs = data as any[];

  const activeJobs = jobs.filter((job: any) => job.status === 'active' || job.status === 'published').length;
  // Default to 0 as columns are missing
  const totalApplicants = 0; // jobs.reduce((sum, job) => sum + (job.applications_count || 0), 0);
  const jobViews = 0; // jobs.reduce((sum, job) => sum + (job.views_count || 0), 0);
  
  // Avg Conversion (avoid division by zero)
  const avgConversion = '0%';

  // Recent jobs (take top 5 sorted by posted_at)
  const recentJobs = [...jobs]
    .sort((a: any, b: any) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())
    .slice(0, 5)
    .map((job: any) => ({
      id: job.id, // Map ID
      title: job.title,
      type: job.type || 'Full-time', // Default if missing
      posted: new Date(job.posted_at).toLocaleDateString(),
      applicants: 0, // job.applications_count || 0,
      status: job.status,
      location: job.location,
      salary: job.salary_range
    }));

  return {
    stats: [
      { name: "Active Jobs", value: activeJobs.toString(), change: "0", changeType: "neutral", icon: "Briefcase" },
      { name: "Total Applicants", value: totalApplicants.toString(), change: "0", changeType: "neutral", icon: "Users" },
      { name: "Job Views", value: jobViews.toString(), change: "0", changeType: "neutral", icon: "Eye" },
      { name: "Avg. Conversion", value: avgConversion, change: "0", changeType: "neutral", icon: "TrendingUp" },
    ],
    recentJobs
  };
}

export async function getJobRoles(search?: string) {
  const supabase = getSupabase();
  
  // Try to fetch from 'job_roles' table
  let query = supabase
    .from('job_roles')
    .select('name, slug')
    .order('name');

  if (search) {
    query = query.ilike('name', `%${search}%`).limit(10);
  }

  const { data, error } = await query;

  if (error) {
    console.warn("Failed to fetch job roles (table might be missing):", error.message);
    return [];
  }

  return data;
}

export async function createJob(job: JobPost) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('jobs')
    .insert([
      {
        ...job,
        status: 'active',
        source: job.source || 'employer',
        posted_at: new Date().toISOString(),
      }
    ] as any)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getJobs(companyId?: string) {
  const supabase = getSupabase();
  
  let query = supabase.from('jobs').select('*').order('posted_at', { ascending: false });
  
  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
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
    throw new Error(error.message);
  }

  return data;
}

export async function getCompanyUsers(companyId: string) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('company_id', companyId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateCompany(id: string, updates: Partial<CompanyProfile>) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('companies')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function uploadCompanyLogo(companyId: string, file: File) {
    const supabase = getSupabase();
    const fileExt = file.name.split('.').pop();
    const fileName = `${companyId}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;
    const BUCKET_NAME = 'company-logos';
  
    // Attempt to upload
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);
  
    if (uploadError) {
      // If bucket not found, try to create it (Note: This usually requires admin rights, 
      // but worth a try or at least providing a better error)
      if (uploadError.message.includes('Bucket not found')) {
         throw new Error("Storage bucket 'company-logos' not found. Please run the supabase_setup.sql script.");
      }
      throw new Error(uploadError.message);
    }
  
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
  
    return data.publicUrl;
}


export async function createCompany(company: CompanyProfile) {
  const supabase = getSupabase();
  
  // Generate a simple slug
  const slug = company.slug || company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const { data, error } = await supabase
    .from('companies')
    .insert([
      {
        ...company,
        slug,
      }
    ] as any)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createUser(clerkId: string, email: string, fullName: string, role: string, companyId?: string, phone?: string, phoneVerified?: boolean) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        clerk_id: clerkId,
        email,
        full_name: fullName,
        role,
        company_id: companyId,
        phone,
        phone_verified: phoneVerified
      }
    ] as any)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getUserByClerkId(clerkId: string) {
  const supabase = getSupabase();
  
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
