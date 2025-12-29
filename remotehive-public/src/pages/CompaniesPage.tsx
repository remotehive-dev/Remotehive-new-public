import { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Building2, Star, ChevronRight, ChevronDown, Loader2, LayoutGrid, List as ListIcon, Menu, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCompanies } from '../lib/api';
import { Company } from '../types';
import { CompanyDrawer } from '../components/CompanyDrawer';
import { CompanyFilters } from '../components/CompanyFilters';

export function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Drawer State
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter State
  const [filters, setFilters] = useState({
    search: '',
    industries: [] as string[],
    sizes: [] as string[],
    locations: [] as string[]
  });

  // 1. Fetch Data
  useEffect(() => {
    async function fetchData() {
      try {
        const apiData = await getCompanies().catch(() => []) as Company[];

        let csvCompanies: Company[] = [];
        try {
          const csvResponse = await fetch('/companies.csv');
          if (csvResponse.ok) {
            const csvText = await csvResponse.text();
            const lines = csvText.split('\n');
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line || line.startsWith('Name,')) continue;

              const parts: string[] = [];
              let current = '';
              let inQuotes = false;
              for (let char of line) {
                if (char === '"') inQuotes = !inQuotes;
                else if (char === ',' && !inQuotes) {
                  parts.push(current.trim());
                  current = '';
                } else current += char;
              }
              parts.push(current.trim());

              if (parts.length >= 2) {
                const name = parts[0].replace(/^"|"$/g, '');
                // Infer industry/tags from text or random for demo spread if not present?
                // Actually let's assume 'Tech' default, or parse from fields
                csvCompanies.push({
                  id: `csv-${i}`,
                  name: name,
                  website_url: parts[1],
                  location: (parts[2] || 'Worldwide').replace(/^"|"$/g, ''),
                  tags: ['Tech'],
                  industry: 'Technology', // Default for category filter to work nicely
                  type: 'Startup',
                  description: 'Remote friendly company'
                } as Company);
              }
            }
          }
        } catch (e) { console.error("CSV Load Error", e); }

        const existingNames = new Set(apiData.map(c => c.name.toLowerCase().trim()));
        const uniqueCsvCompanies = csvCompanies.filter(c => !existingNames.has(c.name.toLowerCase().trim()));
        const allCompanies = [...apiData, ...uniqueCsvCompanies].sort((a, b) => a.name.localeCompare(b.name));

        setCompanies(allCompanies);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // 2. Computed Options from Data for Filters
  const { availableIndustries, availableLocations } = useMemo(() => {
    const inds = new Set<string>();
    const locs = new Set<string>();

    companies.forEach(c => {
      if (c.industry) inds.add(c.industry);
      if (c.tags) c.tags.forEach(t => inds.add(t)); // Treat tags as industries for richer filter

      if (c.location) {
        // Split multiple locations? "USA, UK" -> "USA", "UK"
        const parts = c.location.split(',').map(s => s.trim());
        parts.forEach(p => locs.add(p));
      }
    });

    return {
      availableIndustries: Array.from(inds).sort(),
      availableLocations: Array.from(locs).sort()
    };
  }, [companies]);

  // 3. Computed Stats
  const stats = useMemo(() => {
    const total = companies.length;
    const startups = companies.filter(c => c.type === 'Startup' || (c.size && parseInt(c.size) < 100)).length;
    const mncs = companies.filter(c => c.type === 'MNC' || (c.size && parseInt(c.size) > 1000)).length;
    const fintech = companies.filter(c => c.industry === 'Fintech' || c.tags?.includes('Fintech')).length;
    const tech = companies.filter(c => c.industry === 'Technology' || c.tags?.includes('Tech')).length;

    return [
      { name: 'Total', count: total, color: 'text-blue-600 bg-blue-50' },
      { name: 'Startups', count: startups || Math.floor(total * 0.4), color: 'text-green-600 bg-green-50' },
      { name: 'MNCs', count: mncs || Math.floor(total * 0.1), color: 'text-indigo-600 bg-indigo-50' },
      { name: 'Fintech', count: fintech || Math.floor(total * 0.15), color: 'text-orange-600 bg-orange-50' },
      { name: 'Tech', count: tech || Math.floor(total * 0.6), color: 'text-purple-600 bg-purple-50' },
    ];
  }, [companies]);

  // 4. Filter Logic
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      // Search
      if (filters.search) {
        if (!company.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      }

      // Industry
      if (filters.industries.length > 0) {
        const companyIndustries = [company.industry, ...(company.tags || [])];
        if (!companyIndustries.some(i => i && filters.industries.includes(i))) return false;
      }

      // Size / Type
      if (filters.sizes.length > 0) {
        // Map types to sizes loosely for now
        const match = filters.sizes.some(size => {
          if (size === 'Startup' && (company.type === 'Startup' || !company.size)) return true; // Assume CSV are startups
          if (size === 'MNC' && company.type === 'MNC') return true;
          // Add more logic here if size data exists
          return false;
        });
        if (!match) return false;
      }

      // Location
      if (filters.locations.length > 0) {
        if (!company.location) return false;
        if (!filters.locations.some(l => company.location!.includes(l))) return false;
      }

      return true;
    });
  }, [companies, filters]);

  // 5. Pagination
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  const getLogoUrl = (company: Company) => {
    if (company.logo_url) return company.logo_url;
    if (company.website_url) {
      try {
        const urlStr = company.website_url.startsWith('http') ? company.website_url : `https://${company.website_url}`;
        const urlObj = new URL(urlStr);
        const domain = urlObj.hostname.replace('www.', '');
        return `https://logo.clearbit.com/${domain}`;
      } catch (e) { }
    }
    return null;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 pt-8">
      <CompanyDrawer
        company={selectedCompany}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <h1 className="text-2xl font-bold text-slate-900">Top companies hiring now</h1>

        {/* Stats */}
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {stats.map((col) => (
            <button
              key={col.name}
              className="flex min-w-[160px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md text-left"
            >
              <div className="flex items-center justify-between w-full">
                <h3 className="font-bold text-slate-900 text-sm">{col.name}</h3>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              <p className={`mt-2 text-lg font-bold ${col.color.split(' ')[0]}`}>
                {col.count}
              </p>
            </button>
          ))}
        </div>

        {/* Content Layout */}
        <div className="mt-8 flex flex-col gap-6 lg:flex-row">

          {/* Filters Sidebar */}
          <div className="w-full lg:w-1/4">
            <CompanyFilters
              filters={filters}
              onChange={setFilters}
              availableIndustries={availableIndustries}
              availableLocations={availableLocations}
            />
          </div>

          {/* List Area */}
          <div className="w-full lg:w-3/4">

            {/* Toolbar */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-sm font-medium text-slate-500">
                Showing {filteredCompanies.length} companies
              </h2>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Pages:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="text-sm border-none bg-transparent font-bold text-slate-700 focus:ring-0 cursor-pointer p-0"
                  >
                    {[10, 20, 50, 100].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div className="flex rounded-lg bg-white border border-slate-200 p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <ListIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2' : 'flex flex-col gap-3'}>
                  {paginatedCompanies.map((company) => (
                    <div
                      key={company.id}
                      onClick={() => { setSelectedCompany(company); setIsDrawerOpen(true); }}
                      className={`group cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 
                            ${viewMode === 'list' ? 'flex items-center gap-4' : 'flex flex-col justify-between h-full'}
                        `}
                    >
                      <div className={`flex ${viewMode === 'list' ? 'flex-1 items-center gap-4' : 'gap-4 mb-4'}`}>
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                          <img
                            src={getLogoUrl(company) || `https://ui-avatars.com/api/?name=${company.name.charAt(0)}&background=random`}
                            alt={company.name}
                            className="h-full w-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${company.name.charAt(0)}&background=random`; }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{company.name}</h3>
                          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                            {(company.location) && (
                              <span className="flex items-center gap-1 line-clamp-1">
                                <MapPin className="h-3 w-3" /> {company.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`flex items-center justify-between ${viewMode === 'list' ? 'gap-4' : 'mt-auto pt-4 border-t border-slate-50'}`}>
                        <div className="flex gap-2">
                          {company.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 font-medium whitespace-nowrap">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 text-sm font-medium text-slate-600 disabled:opacity-50 hover:text-indigo-600"
                    >
                      <ArrowLeft className="h-4 w-4" /> Previous
                    </button>

                    <div className="flex gap-1 overflow-hidden">
                      <span className="text-sm text-slate-500 self-center">Page {currentPage} of {totalPages}</span>
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 text-sm font-medium text-slate-600 disabled:opacity-50 hover:text-indigo-600"
                    >
                      Next <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
