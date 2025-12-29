import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { JobList } from '../components/JobList';
import { JobSearch } from '../components/JobSearch';
import { QuickFilters } from '../components/QuickFilters';
import { TopCompanies } from '../components/TopCompanies';
import { FeaturedRoles } from '../components/FeaturedRoles';
import { Job } from '../types';
import { getJobs } from '../lib/api';
import { Loader2 } from 'lucide-react';

export function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const data = await getJobs();
        // Just show the first 6 for the homepage
        setJobs(data.slice(0, 6));
      } catch (err) {
        console.error('Failed to fetch jobs', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobs();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-20 text-center">
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          Find Your Dream <span className="text-indigo-600">Remote Job</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600">
          Connect with top companies offering remote opportunities worldwide. Your next career move is just a click away.
        </p>
        
        <JobSearch />
        <QuickFilters />
        <TopCompanies />
        <FeaturedRoles />
        
        <div className="mt-12 flex justify-center gap-4">
          <Link
            to="/jobs"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Browse all jobs &rarr;
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4 border-t border-slate-100 pt-8">
          <div>
            <div className="text-3xl font-bold text-slate-900">10,000+</div>
            <div className="text-sm text-slate-500">Active Jobs</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">2,500+</div>
            <div className="text-sm text-slate-500">Companies</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">95%</div>
            <div className="text-sm text-slate-500">Success Rate</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">50+</div>
            <div className="text-sm text-slate-500">Countries</div>
          </div>
        </div>
      </div>

      {/* Featured Jobs */}
      <section>
        <div className="mb-8 flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured Jobs</h2>
            <p className="mt-1 text-sm text-slate-500">The latest remote opportunities</p>
          </div>
          <Link to="/jobs" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View all jobs
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <JobList jobs={jobs} />
        )}
      </section>
    </div>
  );
}
