import { useState, useEffect } from 'react';
import { Job } from '../types';
import { JobList } from './JobList';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { getJobs } from '../lib/api';

interface CategoryTab {
    id: string;
    label: string;
    filter: { [key: string]: string }; // e.g. { role: 'Engineering' } or { location: 'USA' }
}

interface JobCategorySectionProps {
    title: string;
    subtitle: string;
    categories: CategoryTab[];
    className?: string;
}

export function JobCategorySection({ title, subtitle, categories, className }: JobCategorySectionProps) {
    const [activeTab, setActiveTab] = useState(categories[0].id);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchCategoryJobs() {
            setIsLoading(true);
            try {
                const category = categories.find(c => c.id === activeTab);
                if (category) {
                    // Fetch jobs with the specific filter
                    const data = await getJobs(category.filter);
                    setJobs(data.slice(0, 4)); // Limit to 4 cards for section view
                }
            } catch (err) {
                console.error("Failed to fetch category jobs", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCategoryJobs();
    }, [activeTab]);

    return (
        <section className={clsx("py-8", className)}>
            <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={clsx(
                                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                                activeTab === cat.id
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="min-h-[300px]">
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        <JobList jobs={jobs} />
                        {jobs.length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                No open positions found in this category right now.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
