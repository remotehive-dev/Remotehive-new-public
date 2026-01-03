import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCompanies } from '../lib/api';
import { Company } from '../types';

export function TopCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const data = await getCompanies(20);
        setCompanies(data || []);
      } catch (err) {
        console.error("Failed to load top companies", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompanies();
  }, []);

  if (isLoading) {
    return (
      <div className="mt-20">
        <h2 className="text-center text-2xl font-bold text-slate-900">Top companies hiring now</h2>
        <div className="mt-8 flex justify-center">
            <div className="h-16 w-full max-w-4xl bg-slate-50 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (companies.length === 0) return null;

  return (
    <div className="mt-20">
      <h2 className="text-center text-2xl font-bold text-slate-900 mb-8">Top companies hiring now</h2>
      
      <div className="relative group/container">
        {/* Scroll Shadows - fade effect on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="overflow-x-auto pb-8 pt-4 px-4 flex gap-4 scrollbar-hide snap-x snap-mandatory">
            {companies.map((company) => (
                <Link
                    key={company.id}
                    to={`/jobs?company_name=${encodeURIComponent(company.name)}`}
                    className="group flex-shrink-0 snap-start flex items-center gap-3 px-5 py-3 rounded-2xl border border-slate-200 bg-white transition-all duration-300 origin-bottom hover:scale-110 hover:border-indigo-300 hover:shadow-xl cursor-pointer"
                >
                    <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-white p-1 border border-slate-100 flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-300">
                        {company.logo_url ? (
                            <img 
                                src={company.logo_url} 
                                alt={company.name} 
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const span = e.currentTarget.parentElement?.querySelector('.fallback-text');
                                    if (span) (span as HTMLElement).style.display = 'block';
                                }}
                            />
                        ) : null}
                        <span 
                            className="fallback-text text-slate-400 font-bold text-xs absolute inset-0 flex items-center justify-center bg-slate-50"
                            style={{ display: company.logo_url ? 'none' : 'flex' }}
                        >
                            {company.name.charAt(0)}
                        </span>
                    </div>
                    
                    <span className="text-base font-semibold whitespace-nowrap text-slate-600 group-hover:text-slate-900">
                        {company.name}
                    </span>
                </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
