import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { JobList } from '../components/JobList';
import { JobFilters } from '../components/JobFilters';
import { RecommendedJobs } from '../components/RecommendedJobs';
import { SectionDivider } from '../components/SectionDivider'; // Added Page Breaker
import { GoogleCustomSearch } from '../components/GoogleCustomSearch';
import { Job } from '../types';
import { getJobs, getUserByClerkId, getCompanies } from '../lib/api';
import { Loader2 } from 'lucide-react';
import { useUser, useAuth } from "@clerk/clerk-react";

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useUser();
  const { getToken } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Parse filters from URL
  const filters = {
    keyword: searchParams.get('keyword') || '',
    role: searchParams.get('role') || '',
    location: searchParams.get('location') || '',
    company_name: searchParams.get('company_name') || '',
    tenure: searchParams.get('tenure') || '',
    salary_min: Number(searchParams.get('salary_min')) || 0,
    type: searchParams.get('type') || ''
  };

  const updateFilters = (newFilters: any) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  // Load User Profile for Recommendations
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const token = await getToken({ template: 'supabase' });
        const profile = await getUserByClerkId(user.id, token || undefined);
        setUserProfile(profile);
      } catch (err) {
        console.error("Error loading user profile for recommendations:", err);
      }
    }
    loadProfile();
  }, [user, getToken]);

  // Load Jobs based on filters
  useEffect(() => {
    async function fetchJobs() {
      setIsLoading(true);
      try {
        const data = await getJobs(filters);
        setJobs(data);
      } catch (err) {
        console.error('Failed to fetch jobs', err);
      } finally {
        setIsLoading(false);
      }
    }
    // Debounce slightly to avoid rapid re-fetches on typing
    const timer = setTimeout(() => {
      fetchJobs();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchParams.toString()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* Page Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Find Your Next Role</h1>
        <p className="mt-2 text-slate-600 font-medium">
          Browse through <span className="text-indigo-600 font-bold">{jobs.length}</span> open positions tailored for you.
        </p>
      </div>

      {/* Recommendations Section */}
      {user && userProfile && (
        <>
          <SectionDivider title="Recommended for You" />
          <RecommendedJobs userProfile={userProfile} />
        </>
      )}

      {/* Main Content Divider */}
      <SectionDivider title="All Jobs" subtitle="Filter and search exactly what you need" className="my-8" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Sidebar Filters */}
        <div className="md:col-span-1">
          <div className="sticky top-24">
            <JobFilters
              filters={filters}
              onFilterChange={updateFilters}
              onClear={clearFilters}
            />
          </div>
        </div>

        {/* Main Job List */}
        <div className="md:col-span-3">
          {/* Google Custom Search */}
          <div className="mb-8 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Search across the web</h3>
             <GoogleCustomSearch />
          </div>

          {/* Horizontal Company Filter */}
          <div className="mb-8 relative group/container">
            {/* Scroll Shadows */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />
            
            <div className="overflow-x-auto pb-8 pt-4 px-2 -mx-2 flex gap-4 scrollbar-hide snap-x snap-mandatory">
              <button
                onClick={() => updateFilters({ company_name: '' })}
                className={`flex-shrink-0 snap-start px-5 py-3 rounded-2xl border text-base font-semibold transition-all duration-300 hover:scale-110 origin-bottom ${
                  !filters.company_name 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:shadow-xl'
                }`}
              >
                All Companies
              </button>
              
              <CompanyHorizontalList selectedCompany={filters.company_name} onSelect={(name) => updateFilters({ company_name: name })} />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium animate-pulse">Finding matching jobs...</p>
              </div>
            </div>
          ) : (
            <JobList jobs={jobs} />
          )}
        </div>

      </div>
    </div>
  );
}

function CompanyHorizontalList({ selectedCompany, onSelect }: { selectedCompany: string, onSelect: (name: string) => void }) {
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCompanies();
        setCompanies(data || []);
      } catch (err) {
        console.error("Failed to load companies for horizontal list", err);
      }
    }
    load();
  }, []);

  return (
    <>
      {companies.map((company) => (
        <button
          key={company.id}
          onClick={() => onSelect(company.name === selectedCompany ? '' : company.name)}
          className={`group flex-shrink-0 snap-start flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 origin-bottom hover:scale-110 ${
            selectedCompany === company.name
              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500 shadow-lg shadow-indigo-100 scale-105'
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xl'
          }`}
        >
          <div className={`h-8 w-8 flex-shrink-0 rounded-lg bg-white p-1 border border-slate-100 flex items-center justify-center overflow-hidden ${selectedCompany === company.name ? '' : 'grayscale group-hover:grayscale-0'} transition-all duration-300`}>
             {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-full w-full object-contain" />
             ) : (
                <span className="text-xs font-bold text-slate-400">{company.name.charAt(0)}</span>
             )}
          </div>
          <span className={`text-base font-semibold whitespace-nowrap ${selectedCompany === company.name ? 'text-indigo-700' : 'text-slate-600 group-hover:text-slate-900'}`}>
            {company.name}
          </span>
        </button>
      ))}
    </>
  );
}
