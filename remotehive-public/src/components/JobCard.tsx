import { Link } from 'react-router-dom';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Link 
      to={`/jobs/${job.id}`}
      className="group relative flex flex-col gap-4 neu-card p-5 hover:-translate-y-1 transition-transform duration-300 border-transparent hover:border-neu-accent/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-neu-base shadow-neu-pressed p-1 flex items-center justify-center">
            {job.company_logo_url ? (
              <img
                src={job.company_logo_url}
                alt={`${job.company_name} logo`}
                className="h-full w-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${job.company_name.charAt(0)}&background=random`;
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-bold text-gray-400">
                {job.company_name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 group-hover:text-neu-accent transition-colors">
              {job.title}
            </h3>
            <p className="text-sm font-medium text-gray-500">{job.company_name}</p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-lg bg-neu-base shadow-neu-flat px-2.5 py-1 text-xs font-bold text-gray-600">
          {job.type}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {job.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-lg bg-neu-base shadow-neu-flat px-2.5 py-1 text-xs font-medium text-neu-accent hover:text-neu-accent-hover transition-colors"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-gray-200/50 pt-4 text-xs font-medium text-gray-500">
        <div className="flex gap-3">
          <span className="flex items-center gap-1">
            🌍 {job.location}
          </span>
          {job.salary_range && (
            <span className="flex items-center gap-1">
              💰 {job.salary_range}
            </span>
          )}
        </div>
        <time dateTime={job.posted_at}>{new Date(job.posted_at).toLocaleDateString()}</time>
      </div>
    </Link>
  );
}
