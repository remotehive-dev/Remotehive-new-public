import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { JobList } from '../components/JobList';
import { Job } from '../types';
import { getJobs } from '../lib/api';
import { Loader2 } from 'lucide-react';

export function JobsPage() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const keyword = searchParams.get('keyword') || '';
  const role = searchParams.get('role') || '';
  const location = searchParams.get('location') || '';
  const type = searchParams.get('type') || '';

  useEffect(() => {
    async function fetchJobs() {
      setIsLoading(true);
      try {
        const data = await getJobs({
          keyword,
          role,
          location,
          type
        });
        setJobs(data);
      } catch (err) {
        console.error('Failed to fetch jobs', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobs();
  }, [keyword, role, location, type]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 neu-card p-8">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Browse Jobs</h1>
        <p className="mt-2 text-gray-600 font-medium">
          Showing <span className="text-neu-accent font-bold">{jobs.length}</span> open positions based on your criteria
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-neu-accent" />
        </div>
      ) : (
        <JobList jobs={jobs} />
      )}
    </div>
  );
}

