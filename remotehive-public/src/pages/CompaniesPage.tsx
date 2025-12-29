import { useState, useEffect } from 'react';
import { Search, MapPin, Building2, Star, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCompanies } from '../lib/api';

// Mock Data for Collections (Keep for UI demo)
const COLLECTIONS = [
  { name: 'MNCs', count: '2.2K+', href: '#', color: 'text-blue-600 bg-blue-50' },
  { name: 'Fintech', count: '135', href: '#', color: 'text-indigo-600 bg-indigo-50' },
  { name: 'FMCG & Retail', count: '170', href: '#', color: 'text-orange-600 bg-orange-50' },
  { name: 'Startups', count: '781', href: '#', color: 'text-green-600 bg-green-50' },
  { name: 'Edtech', count: '169', href: '#', color: 'text-purple-600 bg-purple-50' },
];

export function CompaniesPage() {
  const [isTypeOpen, setIsTypeOpen] = useState(true);
  const [isLocationOpen, setIsLocationOpen] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const data = await getCompanies();
        setCompanies(data);
      } catch (err) {
        console.error('Failed to fetch companies', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompanies();
  }, []);

  return (
    <div className="bg-slate-50 pb-20 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <h1 className="text-2xl font-bold text-slate-900">Top companies hiring now</h1>
        
        {/* Collections Horizontal Scroll */}
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {COLLECTIONS.map((col) => (
            <Link
              key={col.name}
              to={col.href}
              className="flex min-w-[200px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900">{col.name}</h3>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              <p className={`mt-2 text-sm font-medium ${col.color.split(' ')[0]}`}>
                {col.count} Companies ›
              </p>
            </Link>
          ))}
        </div>

        {/* Main Content Split Layout */}
        <div className="mt-12 flex flex-col gap-8 lg:flex-row">
          
          {/* Sidebar Filters */}
          <div className="w-full lg:w-1/4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="font-bold text-slate-900">All Filters</h2>
              </div>

              {/* Company Type Filter */}
              <div className="py-4 border-b border-slate-100">
                <button 
                  className="flex w-full items-center justify-between text-sm font-semibold text-slate-900"
                  onClick={() => setIsTypeOpen(!isTypeOpen)}
                >
                  Company type
                  <ChevronDown className={`h-4 w-4 transition-transform ${isTypeOpen ? 'rotate-180' : ''}`} />
                </button>
                {isTypeOpen && (
                  <div className="mt-3 space-y-2">
                    {['Corporate', 'MNC', 'Startup', 'Agency'].map((item) => (
                      <label key={item} className="flex items-center gap-2">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                        <span className="text-sm text-slate-600">{item}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Location Filter */}
              <div className="py-4">
                <button 
                  className="flex w-full items-center justify-between text-sm font-semibold text-slate-900"
                  onClick={() => setIsLocationOpen(!isLocationOpen)}
                >
                  Location
                  <ChevronDown className={`h-4 w-4 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} />
                </button>
                {isLocationOpen && (
                  <div className="mt-3 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search Location" 
                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    {['Remote', 'Bengaluru', 'Delhi / NCR', 'Mumbai'].map((item) => (
                      <label key={item} className="flex items-center gap-2">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                        <span className="text-sm text-slate-600">{item}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Company Grid */}
          <div className="w-full lg:w-3/4">
            <div className="mb-6">
              <h2 className="text-sm font-medium text-slate-500">Showing {companies.length} companies</h2>
            </div>

            {isLoading ? (
               <div className="flex justify-center py-12">
                 <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
               </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {companies.map((company) => (
                  <Link
                    key={company.id}
                    to={`/companies/${company.id}`}
                    className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className="flex gap-4">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white p-1">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt={company.name} className="h-full w-full object-contain" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100 font-bold text-slate-400">
                            {company.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600">{company.name}</h3>
                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-slate-700">{company.rating || 'N/A'}</span>
                          <span>({company.review_count || 0} reviews)</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {company.tags && company.tags.slice(0, 2).map((tag: string) => (
                            <span key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
