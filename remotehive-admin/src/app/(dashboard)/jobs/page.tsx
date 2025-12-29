"use client";

import { Search, Filter, MoreHorizontal, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { getJobs, getUserByClerkId } from "../../../lib/api";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

// Define the Job type locally or import it if shared
interface Job {
  id: string;
  title: string;
  type: string;
  location: string;
  posted_at: string;
  status: string;
  salary_range: string;
}

export default function JobsListPage() {
  const { user } = useUser();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      if (!user) return;
      
      try {
        const dbUser = await getUserByClerkId(user.id);
        const companyId = (dbUser as any).company_id;
        
        if (companyId) {
          const data = await getJobs(companyId);
          setJobs(data as any);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobs();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>
        <Link
          href="/post-job"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Post New Job
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Filters */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">Error loading jobs: {error}</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Job Title</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">Location</th>
                  <th className="px-6 py-3 font-semibold">Posted</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{job.title}</td>
                    <td className="px-6 py-4">{job.type}</td>
                    <td className="px-6 py-4">{job.location}</td>
                    <td className="px-6 py-4">{new Date(job.posted_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        job.status === "active" ? "bg-green-100 text-green-800" : 
                        job.status === "closed" ? "bg-slate-100 text-slate-800" :
                        "bg-amber-100 text-amber-800"
                      )}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-slate-600">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No jobs found. Post your first job!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        
        {/* Pagination */}
        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">Showing 1 to 5 of 12 results</p>
          <div className="flex gap-2">
            <button className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              Previous
            </button>
            <button className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
