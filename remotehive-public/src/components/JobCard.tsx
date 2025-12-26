import { Link } from 'react-router-dom';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Link 
      to={`/jobs/${job.id}`}
      className="group relative flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white p-2 shadow-sm group-hover:shadow-md transition-shadow">
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
              <div className="flex h-full w-full items-center justify-center text-xl font-bold text-indigo-600 bg-indigo-50 rounded-lg">
                {job.company_name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors line-clamp-1">
              {job.title}
            </h3>
            <p className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{job.company_name}</p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
          {job.type}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mt-1">
        {job.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            {tag}
          </span>
        ))}
        {job.tags.length > 3 && (
          <span className="inline-flex items-center rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
            +{job.tags.length - 3}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5 text-slate-600">
            🌍 {job.location}
          </span>
          {job.salary_range && (
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              💰 {job.salary_range}
            </span>
          )}
        </div>
        <time dateTime={job.posted_at} className="text-slate-400">
          {new Date(job.posted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </time>
      </div>
    </Link>
  );
}
