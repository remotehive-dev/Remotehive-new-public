import { Search, ChevronDown, Filter, X } from 'lucide-react';
import { useState } from 'react';

interface FilterState {
    search: string;
    industries: string[];
    sizes: string[];
    locations: string[];
}

interface CompanyFiltersProps {
    filters: FilterState;
    onChange: (newFilters: FilterState) => void;
    // Dynamic options derived from data
    availableIndustries: string[];
    availableLocations: string[];
}

export function CompanyFilters({ filters, onChange, availableIndustries, availableLocations }: CompanyFiltersProps) {
    const [openSections, setOpenSections] = useState({
        industry: true,
        size: true,
        location: true
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const updateArrayFilter = (key: 'industries' | 'sizes' | 'locations', value: string) => {
        const current = filters[key];
        const next = current.includes(value)
            ? current.filter(item => item !== value)
            : [...current, value];
        onChange({ ...filters, [key]: next });
    };

    const clearAll = () => {
        onChange({
            search: '',
            industries: [],
            sizes: [],
            locations: []
        });
    };

    const hasActiveFilters = filters.search || filters.industries.length > 0 || filters.sizes.length > 0 || filters.locations.length > 0;

    // Size Options (Static definitions)
    const SIZE_OPTIONS = [
        { label: 'Startup (1-50)', value: 'Startup' },
        { label: 'Mid-size (51-200)', value: 'Mid-size' },
        { label: 'Large (201-1000)', value: 'Large' },
        { label: 'Enterprise (1000+)', value: 'Enterprise' },
    ];

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sticky top-24">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <h2 className="font-bold text-slate-900">Filters</h2>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={clearAll}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                        <X className="h-3 w-3" /> Clear
                    </button>
                )}
            </div>

            {/* 1. Keyword Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search company..."
                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={filters.search}
                        onChange={(e) => onChange({ ...filters, search: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-1 divide-y divide-slate-100">

                {/* 2. Industry Filter */}
                <div className="py-4">
                    <button
                        onClick={() => toggleSection('industry')}
                        className="flex w-full items-center justify-between text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                        Industry / Sector
                        <ChevronDown className={`h-4 w-4 transition-transform text-slate-400 ${openSections.industry ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.industry && (
                        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                            {availableIndustries.slice(0, 10).map(industry => (
                                <label key={industry} className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 transition-colors"
                                        checked={filters.industries.includes(industry)}
                                        onChange={() => updateArrayFilter('industries', industry)}
                                    />
                                    <span className="text-sm text-slate-600 group-hover:text-slate-900">{industry}</span>
                                </label>
                            ))}
                            {availableIndustries.length > 10 && (
                                <p className="text-xs text-slate-400 italic pl-6 pt-1">
                                    + {availableIndustries.length - 10} more
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Company Size */}
                <div className="py-4">
                    <button
                        onClick={() => toggleSection('size')}
                        className="flex w-full items-center justify-between text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                        Company Size
                        <ChevronDown className={`h-4 w-4 transition-transform text-slate-400 ${openSections.size ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.size && (
                        <div className="mt-3 space-y-2">
                            {SIZE_OPTIONS.map(opt => (
                                <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 transition-colors"
                                        checked={filters.sizes.includes(opt.value)}
                                        onChange={() => updateArrayFilter('sizes', opt.value)}
                                    />
                                    <span className="text-sm text-slate-600 group-hover:text-slate-900">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. Location */}
                <div className="py-4">
                    <button
                        onClick={() => toggleSection('location')}
                        className="flex w-full items-center justify-between text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                        Headquarters
                        <ChevronDown className={`h-4 w-4 transition-transform text-slate-400 ${openSections.location ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.location && (
                        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                            <input
                                type="text"
                                placeholder="Filter locations..."
                                className="w-full text-xs border-b border-slate-200 pb-2 mb-2 focus:outline-none focus:border-indigo-500"
                            />
                            {availableLocations.slice(0, 15).map(loc => (
                                <label key={loc} className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 transition-colors"
                                        checked={filters.locations.includes(loc)}
                                        onChange={() => updateArrayFilter('locations', loc)}
                                    />
                                    <span className="text-sm text-slate-600 group-hover:text-slate-900 truncate">{loc}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
