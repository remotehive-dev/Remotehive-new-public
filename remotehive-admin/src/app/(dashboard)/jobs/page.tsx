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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Jobs</h1>
          <p className="mt-1 text-slate-500">Manage your job postings and applications</p>
        </div>
        <Link
          href="/post-job"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Post New Job
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
              />
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
              <Filter className="h-4 w-4 text-slate-500" />
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
            <div className="p-8 text-center text-red-600 bg-red-50 m-6 rounded-lg border border-red-100">
              <p className="font-semibold">Error loading jobs</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-900">Job Title</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Type</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Location</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Posted</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{job.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                        {job.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{job.location}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(job.posted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
                        job.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                        job.status === "closed" ? "bg-slate-100 text-slate-700 border-slate-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        <span className={clsx(
                          "mr-1.5 h-1.5 w-1.5 rounded-full",
                          job.status === "active" ? "bg-emerald-500" : 
                          job.status === "closed" ? "bg-slate-500" :
                          "bg-amber-500"
                        )} />
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                        <Search className="h-6 w-6 text-indigo-600" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-slate-900">No jobs found</h3>
                      <p className="mt-1 text-slate-500">Get started by posting your first job opening.</p>
                      <div className="mt-6">
                        <Link
                          href="/post-job"
                          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Post Job
                        </Link>
                      </div>
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
