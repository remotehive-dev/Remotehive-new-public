import { Search, MapPin, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

const LOCATIONS = [
  "Worldwide",
  "North America",
  "Europe",
  "Asia",
  "Latin America",
  "Africa",
  "Australia / NZ",
];

export function JobSearch() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.append("keyword", keyword);
    if (role) params.append("role", role);
    if (location) params.append("location", location);
    
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <form 
      onSubmit={handleSearch}
      className="mx-auto mt-8 max-w-4xl transform rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200 transition-all hover:shadow-xl sm:p-4"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Keyword Input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Job title or keyword"
            className="block w-full rounded-xl border-0 bg-slate-50 py-3 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        {/* Role Dropdown */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Briefcase className="h-5 w-5 text-slate-400" />
          </div>
          <select
            className="block w-full appearance-none rounded-xl border-0 bg-slate-50 py-3 pl-10 pr-8 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Any Role</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Location Dropdown */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MapPin className="h-5 w-5 text-slate-400" />
          </div>
          <select
            className="block w-full appearance-none rounded-xl border-0 bg-slate-50 py-3 pl-10 pr-8 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">Any Location</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 md:w-auto"
        >
          Search
        </button>
      </div>
    </form>
  );
}
