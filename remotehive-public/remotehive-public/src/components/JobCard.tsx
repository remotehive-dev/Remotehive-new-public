import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Job } from '../types';
import { ChevronDown, ChevronUp, Heart, Briefcase, MapPin, DollarSign, Clock, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false); // Mock state for now

  // Stats (Mocked or Real if available)
  const viewCount = job.job_reference_id ? parseInt(job.job_reference_id.slice(-2)) + 5 : Math.floor(Math.random() * 20) + 1;
  const applicantCount = job.job_reference_id ? parseInt(job.job_reference_id.slice(-3)) + 12 : Math.floor(Math.random() * 50) + 5;

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent duplicate clicks
    e.preventDefault();
    setIsWishlisted(!isWishlisted);
  };

  // Infer experience from tags or title if not explicitly available
  const experienceLevel = job.tags.find(t =>
    ['Senior', 'Junior', 'Entry', 'Mid', 'Lead', 'Manager'].some(l => t.includes(l))
  ) || "Mid-Level"; // Default fallback

  return (
    <div
      className={clsx(
        "group relative flex flex-col rounded-xl border bg-white transition-all duration-300 h-full",
        isExpanded ? "border-indigo-400 shadow-md ring-1 ring-indigo-400" : "border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md"
      )}
    >
      {/* Main Card Content (Always Visible) */}
      <div
        onClick={toggleExpand}
        className="p-5 cursor-pointer flex flex-col gap-3 h-full justify-between"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4 items-start w-full">
              {/* Logo */}
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
              {job.company_logo_url ? (
                <img
                  src={job.company_logo_url}
                  alt={`${job.company_name} logo`}
                  className="h-full w-full object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${job.company_name.charAt(0)}&background=random`;
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-indigo-600 bg-indigo-50 rounded-lg">
                  {job.company_name.charAt(0)}
                </div>
              )}
            </div>

            {/* Title & Company */}
            <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-8">
              <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors break-words" title={job.title}>
                {job.title}
              </h3>
              <p className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 transition-colors truncate" title={job.company_name}>{job.company_name}</p>
            </div>
          </div>

          {/* Wishlist Button */}
          <button
            onClick={toggleWishlist}
            className={clsx(
              "absolute top-5 right-5 p-1.5 rounded-full transition-colors z-10",
              isWishlisted ? "bg-pink-50 text-pink-500" : "text-slate-300 hover:bg-slate-100 hover:text-pink-500"
            )}
            title="Save to Wishlist"
          >
            <Heart className={clsx("w-4 h-4", isWishlisted && "fill-current")} />
          </button>
        </div>
        </div>

        {/* Key Info Row */}
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center text-sm text-slate-500">
             <MapPin className="w-4 h-4 mr-1.5 text-slate-400 flex-shrink-0" />
             <span className="truncate">{job.location}</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
             {job.salary_range && (
                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-md border border-emerald-100 whitespace-nowrap">
                  <DollarSign className="w-3.5 h-3.5" />
                  {job.salary_range}
                </span>
             )}
             <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-md border border-blue-100 whitespace-nowrap">
                <Briefcase className="w-3.5 h-3.5" />
                {experienceLevel}
             </span>
             <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1.5 rounded-md border border-purple-100 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5" />
                {job.type}
             </span>
          </div>
        </div>

        {/* Toggle Arrow */}
        <div className="flex justify-center -mb-2 mt-auto">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-300" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 duration-200">
          <div className="border-t border-slate-100 pt-4 mb-4">
            <h4 className="font-semibold text-slate-800 mb-2">Job Description</h4>
            <div className="text-sm text-slate-600 leading-relaxed line-clamp-3">
              {(job.description && job.description !== "No description provided.") ? (
                // Strip HTML tags for preview
                job.description.replace(/<[^>]*>/g, '')
              ) : (
                <span className="italic text-slate-500">
                  Full description available on the application site. Click 'Apply Now' or 'View Full Details' to learn more.
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {job.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-medium">
                {tag}
              </span>
            ))}
          </div>

          {/* Social Proof Stats */}
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 font-medium pl-1">
            <span className="flex items-center gap-1.5" title="People looking at this job right now">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {viewCount} viewing currently
            </span>
            <span className="flex items-center gap-1.5" title="Total applicants so far">
              <div className="flex -space-x-1.5 overflow-hidden">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 w-4 rounded-full ring-1 ring-white bg-indigo-100 flex items-center justify-center text-[8px] font-bold text-indigo-700">
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              {applicantCount} applicants
            </span>
          </div>

          <div className="flex gap-3">
            <a
              href={job.application_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-indigo-600 text-white text-center py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              Apply Now
              <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              to={`/jobs/${job.id}`}
              className="flex-1 bg-white border border-slate-200 text-slate-700 text-center py-2.5 rounded-xl font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              View Full Details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
