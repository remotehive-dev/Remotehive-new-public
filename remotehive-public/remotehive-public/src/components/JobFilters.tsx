import { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, DollarSign, Building2, User, X, Filter } from 'lucide-react';
import { getCompanies } from '../lib/api';
import { clsx } from 'clsx';

interface JobFiltersProps {
    filters: {
        keyword: string;
        role: string;
        location: string;
        company_name: string;
        tenure: string;
        salary_min: number;
    };
    onFilterChange: (newFilters: any) => void;
    onClear: () => void;
}

const ROLES = [
    "Engineering",
    "Design",
    "Product",
    "Marketing",
    "Sales",
    "Customer Support",
    "Data Science",
    "Finance",
    "HR",
];

const TENURE_LEVELS = [
    { label: 'Entry Level', value: 'entry' },
    { label: 'Mid Level', value: 'mid' },
    { label: 'Senior', value: 'senior' },
    { label: 'Manager / Lead', value: 'manager' },
];

const SALARY_RANGES = [
    { label: '$30k+', value: 30000 },
    { label: '$50k+', value: 50000 },
    { label: '$80k+', value: 80000 },
    { label: '$100k+', value: 100000 },
    { label: '$150k+', value: 150000 },
    { label: '$200k+', value: 200000 },
];

export function JobFilters({ filters, onFilterChange, onClear }: JobFiltersProps) {
    const [companies, setCompanies] = useState<any[]>([]);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    useEffect(() => {
        async function loadCompanies() {
            const data = await getCompanies();
            setCompanies(data || []);
        }
        loadCompanies();
    }, []);

    const handleChange = (key: string, value: any) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const activeFiltersCount = [
        filters.role,
        filters.location,
        filters.company_name,
        filters.tenure,
        filters.salary_min > 0
    ].filter(Boolean).length;

    // Combine roles and tenure for suggestions, plus some extras
    const SUGGESTIONS = [
        "Remote", "React", "Python", "Full Time", "Contract", "Startup",
        ...ROLES,
        ...TENURE_LEVELS.map(t => t.label)
    ];

    return (
        <>
            {/* Mobile Filter Toggle */}
            <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="md:hidden w-full mb-4 flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-xl shadow-sm font-medium text-gray-700"
            >
                <Filter className="w-4 h-4" />
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>

            <div className={clsx(
                "bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-8",
                showMobileFilters ? "block" : "hidden md:block" // Hidden on mobile unless toggled
            )}>
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filters
                    </h2>
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={onClear}
                            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                        >
                            <X className="w-3 h-3" />
                            Clear all
                        </button>
                    )}
                </div>

                {/* Keywords */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Keywords</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search terms..."
                            className="neu-input pl-9 py-2 text-sm w-full"
                            value={filters.keyword}
                            onChange={(e) => handleChange('keyword', e.target.value)}
                        />
                    </div>
                    
                    {/* Horizontal Suggestions */}
                    <div className="mt-3 relative group/suggestions">
                         <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                         <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                         
                         <div className="overflow-x-auto pb-4 pt-2 flex gap-2 scrollbar-hide snap-x snap-mandatory -mx-2 px-2">
                            {SUGGESTIONS.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => handleChange('keyword', filters.keyword === suggestion ? '' : suggestion)}
                                    className={clsx(
                                        "flex-shrink-0 snap-start px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-300 origin-bottom hover:scale-110",
                                        filters.keyword === suggestion
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-105"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:shadow-lg"
                                    )}
                                >
                                    {suggestion}
                                </button>
                            ))}
                         </div>
                    </div>
                </div>

                {/* Role */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            className="neu-input pl-9 py-2 text-sm appearance-none cursor-pointer"
                            value={filters.role}
                            onChange={(e) => handleChange('role', e.target.value)}
                        >
                            <option value="">Any Role</option>
                            {ROLES.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Company */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Company</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            list="companies"
                            type="text"
                            placeholder="Filter by company..."
                            className="neu-input pl-9 py-2 text-sm"
                            value={filters.company_name}
                            onChange={(e) => handleChange('company_name', e.target.value)}
                        />
                        <datalist id="companies">
                            {companies.map(c => (
                                <option key={c.id} value={c.name} />
                            ))}
                        </datalist>
                    </div>
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="City or Country..."
                            className="neu-input pl-9 py-2 text-sm"
                            value={filters.location}
                            onChange={(e) => handleChange('location', e.target.value)}
                        />
                    </div>
                </div>

                {/* Experience Level (Tenure) */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Experience Level</label>
                    <div className="space-y-2">
                        {TENURE_LEVELS.map((level) => (
                            <label key={level.value} className="flex items-center gap-2 cursor-pointer group">
                                <div className={clsx(
                                    "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                                    filters.tenure === level.value
                                        ? "border-indigo-600 bg-indigo-600"
                                        : "border-slate-300 group-hover:border-indigo-400"
                                )}>
                                    {filters.tenure === level.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <input
                                    type="radio"
                                    name="tenure"
                                    className="hidden"
                                    checked={filters.tenure === level.value}
                                    onChange={() => handleChange('tenure', filters.tenure === level.value ? '' : level.value)}
                                    onClick={(e) => {
                                        // Allow unselecting radio button
                                        if (filters.tenure === level.value) {
                                            handleChange('tenure', '');
                                            e.preventDefault();
                                        }
                                    }}
                                />
                                <span className={clsx(
                                    "text-sm font-medium transition-colors",
                                    filters.tenure === level.value ? "text-indigo-700" : "text-slate-600 group-hover:text-slate-900"
                                )}>
                                    {level.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Salary Range */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Min. Salary</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            className="neu-input pl-9 py-2 text-sm appearance-none cursor-pointer"
                            value={filters.salary_min}
                            onChange={(e) => handleChange('salary_min', Number(e.target.value))}
                        >
                            <option value={0}>Any Salary</option>
                            {SALARY_RANGES.map(range => (
                                <option key={range.value} value={range.value}>{range.label}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}
