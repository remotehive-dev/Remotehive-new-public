import { Job } from '../types';
import { JobCard } from './JobCard';

interface JobListProps {
  jobs: Job[];
}

export function JobList({ jobs }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center neu-card border-dashed border-2 border-gray-300">
        <p className="text-lg font-bold text-gray-800">No jobs found</p>
        <p className="text-sm text-gray-500">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
