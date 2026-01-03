import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCompany, getJobs } from '../lib/api';
import { Company, Job } from '../types';
import { Loader2, ArrowLeft, Globe, MapPin, Building2, Calendar, Users, Briefcase } from 'lucide-react';
import { JobList } from '../components/JobList';

export function CompanyDetailPage() {
  const { id } = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const [companyData, jobsData] = await Promise.all([
          getCompany(id),
          getJobs({ companyId: id })
        ]);
        setCompany(companyData);
        setJobs(jobsData);
      } catch (err) {
        console.error('Failed to fetch company details', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!company) return <div className="py-20 text-center">Company not found</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/companies" className="mb-6 inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Link>
        
        {/* Header */}
        <div className="mb-8 rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
                    {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} className="h-full w-full object-contain rounded-lg" />
                    ) : (
                         <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-3xl font-bold text-indigo-600 rounded-lg">
                            {company.name.charAt(0)}
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-900">{company.name}</h1>
                    {company.website_url && (
                        <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
                            <Globe className="mr-1.5 h-4 w-4" />
                            Visit Website
                        </a>
                    )}
                    
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                        {company.location && (
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                {company.location}
                            </div>
                        )}
                        {company.size && (
                             <div className="flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-slate-400" />
                                {company.size} employees
                            </div>
                        )}
                         {company.founded && (
                             <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                Founded {company.founded}
                            </div>
                        )}
                        {company.industry && (
                             <div className="flex items-center gap-1.5">
                                <Building2 className="h-4 w-4 text-slate-400" />
                                {company.industry}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
             {company.description && (
                <div className="mt-8 border-t border-slate-100 pt-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-2">About</h2>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{company.description}</p>
                </div>
            )}
        </div>
        
        {/* Jobs */}
        <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-indigo-600" />
                Open Positions ({jobs.length})
            </h2>
            <JobList jobs={jobs} />
        </div>
    </div>
  );
}
