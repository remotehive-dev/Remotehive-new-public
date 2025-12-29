import { useEffect, useState } from 'react';
import { JobList } from '../../components/JobList';
import { Job, Company } from '../../types';
import { getJobs, getCompanies } from '../../lib/api';
import { Loader2, Sparkles, Filter, Calendar, Building2, Search, Globe } from 'lucide-react';

const POPULAR_LOCATIONS = [
  { id: 'remote', label: 'Remote', icon: '🌍' },
  { id: 'united states', label: 'United States', icon: '🇺🇸' },
  { id: 'india', label: 'India', icon: '🇮🇳' },
  { id: 'united kingdom', label: 'United Kingdom', icon: '🇬🇧' },
  { id: 'canada', label: 'Canada', icon: '🇨🇦' },
  { id: 'europe', label: 'Europe', icon: '🇪🇺' },
  { id: 'australia', label: 'Australia', icon: '🇦🇺' },
  { id: 'germany', label: 'Germany', icon: '🇩🇪' },
];

export function JobFeedPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [dateFilter, setDateFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const companiesData = await getCompanies();
        setCompanies(companiesData || []);
      } catch (err) {
        console.error('Failed to fetch companies', err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function fetchJobs() {
      setIsLoading(true);
      try {
        const data = await getJobs({
          date_posted: dateFilter,
          companyId: companyFilter || undefined,
          location: countryFilter || undefined,
          keyword: searchQuery || undefined
        });
        setJobs(data);
      } catch (err) {
        console.error('Failed to fetch jobs', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Debounce search slightly
    const timeoutId = setTimeout(() => {
      fetchJobs();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [dateFilter, companyFilter, countryFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          Apply New Jobs
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Discover and apply to the latest opportunities tailored for you.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - Company Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sticky top-6 max-h-[calc(100vh-100px)] flex flex-col">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-600" />
              Companies
            </h3>
            
            <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar flex-1">
              <button
                onClick={() => setCompanyFilter('')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  companyFilter === '' 
                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                    : 'text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-200'
                }`}
              >
                All Companies
              </button>

              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setCompanyFilter(company.id)}
                  className={`group w-full flex items-center gap-3 p-2 rounded-xl border transition-all duration-300 ${
                    companyFilter === company.id
                      ? 'border-purple-500 ring-1 ring-purple-500 bg-purple-50/50 scale-105 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md hover:scale-105'
                  }`}
                >
                  <div className={`h-10 w-10 flex-shrink-0 rounded-lg bg-white p-1 border border-gray-100 flex items-center justify-center overflow-hidden transition-all duration-300 ${
                    companyFilter === company.id ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'
                  }`}>
                    {company.logo_url ? (
                      <img 
                        src={company.logo_url} 
                        alt={company.name} 
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${company.name.charAt(0)}&background=random`;
                        }}
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-400">
                        {company.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-medium truncate transition-colors ${
                    companyFilter === company.id ? 'text-purple-700' : 'text-gray-600 group-hover:text-gray-900'
                  }`}>
                    {company.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          
          {/* Top Filter Area */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4 mb-6">
            
            {/* Row 1: Search & Date */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by job title, role, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              {/* Date Filter */}
              <div className="relative min-w-[180px]">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <option value="all">Any Time</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Row 2: Locations (Horizontal Scroll) */}
            <div>
               <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-3.5 w-3.5 text-purple-600" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Locations</span>
               </div>
               <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar snap-x">
                  <button
                      onClick={() => setCountryFilter('')}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border snap-start ${
                        countryFilter === '' 
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                      }`}
                    >
                      All Locations
                  </button>
                  {POPULAR_LOCATIONS.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => setCountryFilter(loc.id === 'remote' ? 'remote' : loc.label)}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 snap-start ${
                          countryFilter === (loc.id === 'remote' ? 'remote' : loc.label)
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                        }`}
                      >
                        <span>{loc.icon}</span>
                        <span className="text-sm font-medium">{loc.label}</span>
                      </button>
                    ))}
               </div>
            </div>

          </div>
          {/* Results */}
          {isLoading ? (
            <div className="flex justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                <p className="text-gray-500 font-medium animate-pulse">Loading job feed...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {jobs.length > 0 ? (
                <JobList jobs={jobs} />
              ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                  <div className="mx-auto h-12 w-12 text-gray-300">
                    <Search className="h-full w-full" />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No jobs found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search terms.</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setCompanyFilter(''); setDateFilter('all'); setCountryFilter(''); }}
                    className="mt-4 text-sm font-medium text-purple-600 hover:text-purple-500"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
