import { useState, useEffect } from 'react';
import { Search, MapPin, Building2, Star, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCompanies } from '../lib/api';
import { Company } from '../types';

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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState('');

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const data = await getCompanies();
        setCompanies(data as Company[]);
      } catch (err) {
        console.error('Failed to fetch companies', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompanies();
  }, []);

  const toggleFilter = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const filteredCompanies = companies.filter(company => {
    // Type Filter
    if (selectedTypes.length > 0) {
        // Heuristic mapping since we might not have a direct 'type' field in all data
        // We check tags, industry, or infer from size
        const typeMatch = selectedTypes.some(type => {
            if (company.tags?.includes(type)) return true;
            if (company.industry?.includes(type)) return true;
            if (type === 'Startup' && company.size && parseInt(company.size) < 100) return true;
            if (type === 'MNC' && company.size && parseInt(company.size) > 1000) return true;
            if (type === 'Corporate' && company.size && parseInt(company.size) > 100) return true;
            return false;
        });
        // If we strictly want to filter, uncomment next line. 
        // However, if data is missing tags, this might hide everything. 
        // For now, let's strictly filter if selected.
        if (!typeMatch) return false;
    }

    // Location Filter
    if (selectedLocations.length > 0) {
        const locMatch = selectedLocations.some(loc => 
            company.location?.toLowerCase().includes(loc.toLowerCase())
        );
        if (!locMatch) return false;
    }
    
    // Search Location Input
    if (locationSearch) {
        if (!company.location?.toLowerCase().includes(locationSearch.toLowerCase())) return false;
    }

    return true;
  });

  const getLogoUrl = (company: Company) => {
    if (company.logo_url) return company.logo_url;
    if (company.website_url) {
        try {
            const domain = new URL(company.website_url).hostname;
            return `https://logo.clearbit.com/${domain}`;
        } catch (e) {
            // ignore
        }
    }
    return null;
  };

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
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sticky top-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="font-bold text-slate-900">All Filters</h2>
                {(selectedTypes.length > 0 || selectedLocations.length > 0) && (
                    <button 
                        onClick={() => { setSelectedTypes([]); setSelectedLocations([]); setLocationSearch(''); }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                        Clear all
                    </button>
                )}
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
                      <label key={item} className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" 
                            checked={selectedTypes.includes(item)}
                            onChange={() => toggleFilter(selectedTypes, setSelectedTypes, item)}
                        />
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
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    {['Remote', 'Bengaluru', 'Delhi / NCR', 'Mumbai'].map((item) => (
                      <label key={item} className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" 
                            checked={selectedLocations.includes(item)}
                            onChange={() => toggleFilter(selectedLocations, setSelectedLocations, item)}
                        />
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
              <h2 className="text-sm font-medium text-slate-500">Showing {filteredCompanies.length} companies</h2>
            </div>

            {isLoading ? (
               <div className="flex justify-center py-12">
                 <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
               </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredCompanies.map((company) => (
                  <Link
                    key={company.id}
                    to={`/companies/${company.id}`}
                    className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex gap-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                        <img 
                            src={getLogoUrl(company) || `https://ui-avatars.com/api/?name=${company.name.charAt(0)}&background=random`} 
                            alt={company.name} 
                            className="h-full w-full object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${company.name.charAt(0)}&background=random`;
                            }}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{company.name}</h3>
                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          {company.rating ? (
                             <>
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium text-slate-700">{company.rating}</span>
                                <span>({company.review_count || 0} reviews)</span>
                             </>
                          ) : (
                            <span className="text-xs text-slate-400">No ratings yet</span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {company.tags && company.tags.slice(0, 2).map((tag: string) => (
                            <span key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium">
                              {tag}
                            </span>
                          ))}
                          {(!company.tags || company.tags.length === 0) && company.location && (
                             <span className="flex items-center gap-1 text-xs text-slate-500">
                                <MapPin className="h-3 w-3" />
                                {company.location}
                             </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600" />
                  </Link>
                ))}
                {filteredCompanies.length === 0 && (
                    <div className="col-span-2 py-12 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
                        <p className="text-slate-500 font-medium">No companies found matching your filters.</p>
                        <button 
                            onClick={() => { setSelectedTypes([]); setSelectedLocations([]); setLocationSearch(''); }}
                            className="mt-2 text-sm text-indigo-600 font-bold hover:underline"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
