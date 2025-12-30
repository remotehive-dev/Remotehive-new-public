import { useEffect, useState } from 'react';
import { CompanyCategory, getCompanyCategories, getCompanies } from '../../lib/api';
import { Company } from '../../types';
import { Loader2, Search, MapPin, Building2, Star, ChevronRight, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CompaniesFeedPage() {
  const [categories, setCategories] = useState<CompanyCategory[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [cats, comps] = await Promise.all([
          getCompanyCategories(),
          getCompanies() // We might need to filter this API call if list is huge
        ]);
        setCategories(cats);
        setCompanies(comps || []);
      } catch (err) {
        console.error('Failed to load companies data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Basic category filtering simulation since API doesn't support category filtering yet
    // In real app, we would pass category ID to API
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Top Companies Hiring Now</h1>
        <p className="mt-2 text-lg text-gray-600">Explore companies by category and find your perfect fit.</p>
      </div>

      {/* Top Categories Carousel */}
      <div className="mb-12">
        <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar snap-x">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`flex-shrink-0 w-72 bg-white rounded-2xl border transition-all duration-300 snap-center text-left overflow-hidden group hover:shadow-lg ${
                selectedCategory === cat.slug ? 'border-purple-600 ring-2 ring-purple-600 ring-offset-2' : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {cat.name}
                        <ChevronRight className="inline-block ml-1 h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </h3>
                </div>
                <p className="text-sm text-gray-500 mb-6 font-medium">{cat.count} companies actively hiring</p>
                
                {/* Sample Logos Grid */}
                <div className="grid grid-cols-4 gap-2">
                    {cat.sample_logos?.slice(0, 4).map((logo, idx) => (
                        <div key={idx} className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-1">
                            <img src={logo} alt="" className="h-full w-full object-contain" />
                        </div>
                    ))}
                    {[...Array(Math.max(0, 4 - (cat.sample_logos?.length || 0)))].map((_, idx) => (
                        <div key={`empty-${idx}`} className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100/50" />
                    ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar Filters */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-8">
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
            />
          </div>

          {/* Filter Groups */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Company Type</h3>
             </div>
             <div className="space-y-3">
                {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            selectedCategory === cat.slug ? 'bg-purple-600 border-purple-600' : 'border-gray-300 bg-white group-hover:border-purple-400'
                        }`}>
                            {selectedCategory === cat.slug && <span className="text-white text-xs">✓</span>}
                        </div>
                        <input 
                            type="radio" 
                            name="category" 
                            className="hidden" 
                            checked={selectedCategory === cat.slug}
                            onChange={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
                        />
                        <span className={`text-sm ${selectedCategory === cat.slug ? 'text-purple-700 font-medium' : 'text-gray-600'}`}>
                            {cat.name}
                        </span>
                        <span className="ml-auto text-xs text-gray-400">({cat.count})</span>
                    </label>
                ))}
             </div>
          </div>
          
          {/* Location Filter (Mock) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Location</h3>
             </div>
             <div className="space-y-3">
                {['Bengaluru', 'Delhi / NCR', 'Mumbai', 'Hyderabad', 'Pune', 'Chennai', 'Remote'].map(loc => (
                    <label key={loc} className="flex items-center gap-3 cursor-pointer group">
                        <div className="w-5 h-5 rounded border border-gray-300 bg-white group-hover:border-purple-400 flex items-center justify-center transition-colors"></div>
                        <span className="text-sm text-gray-600">{loc}</span>
                    </label>
                ))}
             </div>
          </div>

        </aside>

        {/* Main List */}
        <main className="flex-1">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                    {selectedCategory 
                        ? `${categories.find(c => c.slug === selectedCategory)?.name || 'Companies'} (${filteredCompanies.length})` 
                        : `All Companies (${filteredCompanies.length})`}
                </h2>
                <div className="text-sm text-gray-500">
                    Showing {filteredCompanies.length} results
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredCompanies.map((company) => (
                        <div key={company.id} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow group">
                            {/* Logo */}
                            <div className="w-20 h-20 flex-shrink-0 bg-white rounded-lg border border-gray-100 flex items-center justify-center p-2 shadow-sm">
                                {company.logo_url ? (
                                    <img src={company.logo_url} alt={company.name} className="h-full w-full object-contain" />
                                ) : (
                                    <span className="text-2xl font-bold text-gray-300">{company.name.charAt(0)}</span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                            {company.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center text-yellow-400 text-sm font-bold">
                                                <Star className="h-4 w-4 fill-current" />
                                                <span className="ml-1 text-gray-700">{company.rating || '4.2'}</span>
                                            </div>
                                            <span className="text-gray-300">|</span>
                                            <span className="text-sm text-gray-500">{company.review_count || 120} reviews</span>
                                        </div>
                                    </div>
                                    <Link 
                                        to={`/jobs?company_name=${encodeURIComponent(company.name)}`}
                                        className="hidden md:inline-flex px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-100 transition-colors"
                                    >
                                        View Jobs
                                    </Link>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <Briefcase className="h-4 w-4 text-gray-400" />
                                        <span>{company.industry || 'Technology'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Building2 className="h-4 w-4 text-gray-400" />
                                        <span>{company.type || 'Private'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span>{company.founded || '2010'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span>{company.location || 'Remote'}</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {company.tags?.slice(0, 3).map(tag => (
                                        <span key={tag} className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                                            {tag}
                                        </span>
                                    ))}
                                    {/* Mock Tags if empty */}
                                    {!company.tags?.length && (
                                        <>
                                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">B2B</span>
                                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">SaaS</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>

      </div>
    </div>
  );
}

function Calendar({ className }: { className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    )
}
