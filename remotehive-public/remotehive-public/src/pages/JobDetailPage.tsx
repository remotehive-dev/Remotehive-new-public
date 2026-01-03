import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, DollarSign, Clock, ArrowLeft, Share2, Globe, Building2, Briefcase, Loader2, AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUser, useAuth } from "@clerk/clerk-react";
import { Job } from '../types';
import { getJob, getUserByClerkId } from '../lib/api';
import { getMissingMandatoryFields } from '../lib/profileScore';
import sanitizeHtml from 'sanitize-html';
import { CompanyDrawer } from '../components/CompanyDrawer';

export function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded: isAuthLoaded } = useUser();
  const { getToken } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Application Logic State
  const [isApplying, setIsApplying] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [showCompanyDrawer, setShowCompanyDrawer] = useState(false);

  useEffect(() => {
    async function fetchJob() {
      if (!id) return;
      try {
        const data = await getJob(id);
        setJob(data);
      } catch (err) {
        console.error("Failed to fetch job", err);
        setError("Job not found or failed to load.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchJob();
  }, [id]);

  const handleApply = async () => {
    if (!job) return;
    
    // Internal Application Flow
    if (job.application_method === 'internal') {
        if (!user) {
             navigate('/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname));
             return;
        }
        // Redirect to internal application page (to be implemented)
        navigate(`/jobs/${job.id}/apply`);
        return;
    }

    // External Application Flow (Default)
    if (!user) {
      // Redirect to login if not logged in
      navigate('/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setIsApplying(true);
    try {
      const token = await getToken({ template: 'supabase' });
      const profile = await getUserByClerkId(user.id, token || undefined);
      
      if (profile) {
        const missing = getMissingMandatoryFields(profile);
        if (missing.length > 0) {
          setMissingFields(missing);
          setShowMissingFieldsModal(true);
          setIsApplying(false);
          return;
        }
      } else {
        // No profile found, treat as all missing or redirect to onboarding
        navigate('/onboarding');
        return;
      }

      // If checks pass, open application URL
      window.open(job.application_url || "#", '_blank');

    } catch (err) {
      console.error("Error checking profile:", err);
      // Fallback: let them apply but maybe warn? or just fail safely
      window.open(job.application_url || "#", '_blank');
    } finally {
      setIsApplying(false);
    }
  };

  const parseList = (items: string[] | undefined) => {
    if (!items || items.length === 0) return [];
    // If single item contains newlines, split it
    if (items.length === 1 && items[0].includes('\n')) {
      return items[0]
        .split('\n')
        .map(i => i.trim())
        .filter(i => i.length > 0)
        .map(i => i.replace(/^[-•*]\s*/, '').trim());
    }
    return items;
  };

  if (isLoading || !isAuthLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <h2 className="text-xl font-bold text-slate-900">Job not found</h2>
        <Link to="/jobs" className="mt-4 text-indigo-600 hover:text-indigo-500">
          Back to Jobs
        </Link>
      </div>
    );
  }

  const isHtml = /<[a-z][\s\S]*>/i.test(job.description || '');
  const requirements = parseList(job.requirements);
  const benefits = parseList(job.benefits);

  return (
    <div className="bg-slate-50 min-h-screen py-8 relative">
      {/* Missing Fields Modal */}
      {showMissingFieldsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Incomplete Profile</h3>
              </div>
              <button 
                onClick={() => setShowMissingFieldsModal(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-4">
              <p className="text-gray-600">
                To apply for this job, you must complete the following mandatory fields in your profile:
              </p>
              <ul className="mt-3 space-y-2 rounded-lg bg-red-50 p-4">
                {missingFields.map(field => (
                  <li key={field} className="flex items-center gap-2 text-sm font-medium text-red-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    {field}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowMissingFieldsModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/dashboard/profile')}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Complete Profile
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link to="/jobs" className="mb-8 inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Job Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-5">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
                    {job.company_logo_url ? (
                      <img src={job.company_logo_url} alt={job.company_name} className="h-full w-full object-contain rounded-lg" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-2xl font-bold text-indigo-600 rounded-lg">
                        {job.company_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{job.title}</h1>
                    <div className="mt-2 flex items-center gap-2 text-slate-600 font-medium">
                      <span className="text-slate-900">{job.company_name}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-sm">{job.location}</span>
                    </div>
                  </div>
                </div>
                <button className="rounded-full p-2.5 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-colors border border-transparent hover:border-slate-200">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-1.5 text-sm font-semibold text-slate-700 border border-slate-200">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  {job.type}
                </div>
                {job.workplace_type && (
                  <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-1.5 text-sm font-semibold text-slate-700 border border-slate-200 capitalize">
                    <Globe className="h-4 w-4 text-slate-400" />
                    {job.workplace_type}
                  </div>
                )}
                {job.job_reference_id && (
                  <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-1.5 text-sm font-semibold text-slate-500 border border-slate-200 font-mono">
                    ID: {job.job_reference_id}
                  </div>
                )}
                {job.salary_range && (
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    {job.salary_range}
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {new Date(job.posted_at).toLocaleDateString()}
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={handleApply}
                  disabled={isApplying}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-base font-bold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Checking Profile...
                    </>
                  ) : "Apply Now"}
                </button>
              </div>
            </div>

            {/* Job Description */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">Job Description</h2>
              <div className="mt-4 prose prose-slate max-w-none text-slate-600">
                 {isHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.description || '') }} />
                 ) : (
                    <p className="whitespace-pre-line">{job.description}</p>
                 )}
              </div>

              {requirements && requirements.length > 0 && (
                <>
                  <h3 className="mt-8 text-lg font-bold text-slate-900">Requirements</h3>
                  <ul className="mt-4 space-y-2">
                    {requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-600">
                        <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-600" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {benefits && benefits.length > 0 && (
                <>
                  <h3 className="mt-8 text-lg font-bold text-slate-900">Benefits</h3>
                  <ul className="mt-4 space-y-2">
                    {benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-600">
                        <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">About the Company</h3>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white p-1">
                   {job.company_logo_url ? (
                      <img src={job.company_logo_url} alt={job.company_name} className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 font-bold text-slate-400">
                        {job.company_name.charAt(0)}
                      </div>
                    )}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{job.company_name}</div>
                  <button onClick={() => setShowCompanyDrawer(true)} className="text-sm text-indigo-600 hover:underline">View Profile</button>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <Globe className="mt-0.5 h-4 w-4 text-slate-400" />
                  <span>Website: <a href={job.company?.website_url || '#'} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Visit Site</a></span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <Building2 className="mt-0.5 h-4 w-4 text-slate-400" />
                  <span>Tech & Engineering</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Drawer */}
      {job.company && (
        <CompanyDrawer
          company={job.company}
          isOpen={showCompanyDrawer}
          onClose={() => setShowCompanyDrawer(false)}
        />
      )}
    </div>
  );
}
