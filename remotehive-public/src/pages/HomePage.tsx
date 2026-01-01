import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { JobList } from '../components/JobList';
import { JobSearch } from '../components/JobSearch';
import { QuickFilters } from '../components/QuickFilters';
import { TopCompanies } from '../components/TopCompanies';
import { FeaturedRoles } from '../components/FeaturedRoles';
import { SectionDivider } from '../components/SectionDivider';
import { JobCategorySection } from '../components/JobCategorySection';
import { RecommendedJobs } from '../components/RecommendedJobs';
import { BackgroundElements } from '../components/BackgroundElements';
import { Job } from '../types';
import { djangoApiUrl, getJobs, getUserByClerkId } from '../lib/api';
import { Loader2, Code2, Briefcase, Rocket, Globe, Laptop, Database, Search, User, Zap, BarChart, PenTool } from 'lucide-react';
import { useUser, useAuth } from "@clerk/clerk-react";

interface RoleConfig {
  label: string;
  value: string;
  icon: string;
}

interface RegionConfig {
  label: string;
  value: string;
  icon: string;
  count?: number;
}

interface HomeConfig {
  stats: {
    active_jobs: string;
    companies: string;
    success_rate: string;
    countries: string;
  };
  hero: {
    title: string;
    subtitle: string;
    search_placeholder: string;
  };
  roles: RoleConfig[];
  regions: RegionConfig[];
}

// Icon mapper for dynamic icons
const IconMap: Record<string, any> = {
  Code2, Briefcase, Rocket, Globe, Laptop, Database, Search, User, Zap, BarChart, PenTool
};

export function HomePage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [config, setConfig] = useState<HomeConfig | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      // 1. Fetch Config (Non-blocking)
      try {
        const configRes = await fetch(djangoApiUrl('/api/home-config/'));
        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig(configData);
        } else {
          console.warn('Failed to fetch home config:', configRes.status);
        }
      } catch (err) {
        console.warn('Failed to load home config (using defaults)', err);
      }

      // 2. Fetch Recent Jobs (Independent)
      try {
        const data = await getJobs({ limit: 6 });
        setRecentJobs(data);
      } catch (err) {
        console.error('Failed to load recent jobs', err);
      }

      // 3. Fetch User Profile for Recommendations (Independent)
      if (user) {
        try {
          const token = await getToken({ template: 'supabase' });
          const profile = await getUserByClerkId(user.id, token || undefined);
          setUserProfile(profile);
        } catch (err) {
          console.error('Failed to load user profile', err);
        }
      }
      
      setIsLoading(false);
    }
    loadData();
  }, [user]);

  // Use config or defaults
  const stats = config?.stats || {
    active_jobs: "10k+",
    companies: "2.5k",
    success_rate: "95%",
    countries: "50+"
  };
  
  const hero = config?.hero || {
    title: "Find Your Dream Remote Job",
    subtitle: "Connect with top companies offering remote opportunities worldwide. Your next career move is just a click away.",
    search_placeholder: "Job title or keyword"
  };

  const regions = config?.regions || [
    { label: 'Worldwide', value: 'remote', icon: '🌍' },
    { label: 'United States', value: 'United States', icon: '🇺🇸' },
    { label: 'United Kingdom', value: 'United Kingdom', icon: '🇬🇧' },
    { label: 'Europe', value: 'Europe', icon: '🇪🇺' },
    { label: 'APAC & India', value: 'India', icon: '🌏' },
    { label: 'Canada', value: 'Canada', icon: '🇨🇦' },
    { label: 'Australia', value: 'Australia', icon: '🇦🇺' },
    { label: 'Latin America', value: 'Latin America', icon: '💃' },
  ];

  const roles = config?.roles || [
    { label: 'Engineering', value: 'Engineering', icon: 'Code2' },
    { label: 'Design', value: 'Design', icon: 'Laptop' },
    { label: 'Marketing', value: 'Marketing', icon: 'Rocket' },
    { label: 'Product', value: 'Product', icon: 'Briefcase' },
    { label: 'Sales', value: 'Sales', icon: 'Globe' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 relative z-10">
      <BackgroundElements />
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-16 text-center"
      >
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          {hero.title}
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600">
          {hero.subtitle}
        </p>

        <JobSearch 
          placeholder={hero.search_placeholder} 
          roles={roles.map(r => ({ label: r.label, value: r.value }))}
          locations={regions.map(r => ({ label: r.label, value: r.value }))}
        />
        <QuickFilters />

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4 border-t border-slate-100/50 pt-8 backdrop-blur-sm">
          <div className="p-4 rounded-2xl bg-white/50 border border-white/20 shadow-sm">
            <div className="text-3xl font-bold text-indigo-600">{stats.active_jobs}</div>
            <div className="text-sm font-semibold text-slate-600">Active Jobs</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/50 border border-white/20 shadow-sm">
            <div className="text-3xl font-bold text-indigo-600">{stats.companies}</div>
            <div className="text-sm font-semibold text-slate-600">Companies</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/50 border border-white/20 shadow-sm">
            <div className="text-3xl font-bold text-indigo-600">{stats.success_rate}</div>
            <div className="text-sm font-semibold text-slate-600">Success Rate</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/50 border border-white/20 shadow-sm">
            <div className="text-3xl font-bold text-indigo-600">{stats.countries}</div>
            <div className="text-sm font-semibold text-slate-600">Countries</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
      >
        <TopCompanies />
      </motion.div>

      {/* 1. Recommended Jobs (If Logged In) */}
      {user && userProfile && (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
        >
          <SectionDivider title="For You" subtitle="Jobs matching your profile" />
          <RecommendedJobs userProfile={userProfile} />
        </motion.div>
      )}

      {/* 2. Newly Posted Jobs */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
          <SectionDivider title="Newly Posted" subtitle="Fresh opportunities just added" className="mt-8" />
          <section>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Latest Opportunities</h2>
                <p className="mt-1 text-sm text-slate-500">Fresh from the scraper</p>
              </div>
              <Link to="/jobs" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View all jobs &rarr;
              </Link>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <JobList jobs={recentJobs} />
            )}
          </section>
      </motion.div>

      {/* 3. Jobs by Region */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
          <SectionDivider title="Explore by Region" subtitle="Find jobs in your time zone" className="mt-12" />
          
          {/* Horizontal Region Filter */}
          <div className="relative group/container mb-8">
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            
            <div className="overflow-x-auto pb-8 pt-4 px-4 flex gap-4 scrollbar-hide snap-x snap-mandatory">
                {regions.map((region) => (
                    <Link
                        key={region.label}
                        to={`/jobs?location=${encodeURIComponent(region.value)}`}
                        className="group flex-shrink-0 snap-start flex items-center gap-3 px-5 py-3 rounded-2xl border border-slate-200 bg-white transition-all duration-300 origin-bottom hover:scale-110 hover:border-indigo-300 hover:shadow-xl cursor-pointer"
                    >
                        <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-indigo-50 p-1 border border-indigo-100 flex items-center justify-center text-lg">
                            {region.icon}
                        </div>
                        
                        <span className="text-base font-semibold whitespace-nowrap text-slate-600 group-hover:text-slate-900">
                            {region.label}
                        </span>
                    </Link>
                ))}
            </div>
          </div>

          <JobCategorySection
            title="Remote Hubs"
            subtitle="Find tailored remote roles in your preferred region."
            categories={regions.slice(0, 5).map(r => ({
                id: r.value.toLowerCase().replace(/\s+/g, '-'),
                label: r.label,
                filter: { location: r.value }
            }))}
          />
      </motion.div>

      {/* 4. Jobs by Role */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
          <SectionDivider title="Browse by Role" subtitle="Jobs by category" className="mt-12" />
          
          {/* Horizontal Role Filter (New) */}
          <div className="relative group/container mb-8">
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            
            <div className="overflow-x-auto pb-8 pt-4 px-4 flex gap-4 scrollbar-hide snap-x snap-mandatory">
                {roles.map((role) => {
                    const Icon = IconMap[role.icon] || Briefcase;
                    return (
                        <Link
                            key={role.label}
                            to={`/jobs?role=${encodeURIComponent(role.value)}`}
                            className="group flex-shrink-0 snap-start flex items-center gap-3 px-5 py-3 rounded-2xl border border-slate-200 bg-white transition-all duration-300 origin-bottom hover:scale-110 hover:border-indigo-300 hover:shadow-xl cursor-pointer"
                        >
                            <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-indigo-50 p-1.5 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                <Icon className="w-full h-full" />
                            </div>
                            
                            <span className="text-base font-semibold whitespace-nowrap text-slate-600 group-hover:text-slate-900">
                                {role.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
          </div>


      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <FeaturedRoles />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mt-20 text-center bg-indigo-50/80 backdrop-blur-sm rounded-3xl p-12 border border-indigo-100 shadow-xl shadow-indigo-100/50"
      >
        <h2 className="text-2xl font-bold text-indigo-900 mb-4">Still looking for the perfect fit?</h2>
        <p className="text-indigo-700 mb-8">Browse our full database of {10000}+ active listings.</p>
        <Link
          to="/jobs"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          Browse All Jobs
        </Link>
      </motion.div>

    </div>
  );
}
