"use client";

import { Briefcase, Users, Eye, TrendingUp, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getDashboardStats, getUserByClerkId, DashboardStats } from "../../lib/api";
import Link from "next/link";

const iconMap: Record<string, any> = {
  Briefcase,
  Users,
  Eye,
  TrendingUp
};

export default function DashboardPage() {
  const { user } = useUser();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      try {
        const dbUser = await getUserByClerkId(user.id);
        const companyId = (dbUser as any).company_id;
        
        if (companyId) {
          const statsData = await getDashboardStats(companyId);
          setData(statsData);
        } else {
             // Handle case where user has no company (e.g. incomplete onboarding)
             setData({
                stats: [
                    { name: "Active Jobs", value: "0", change: "0", changeType: "neutral", icon: "Briefcase" },
                    { name: "Total Applicants", value: "0", change: "0", changeType: "neutral", icon: "Users" },
                    { name: "Job Views", value: "0", change: "0", changeType: "neutral", icon: "Eye" },
                    { name: "Avg. Conversion", value: "0%", change: "0", changeType: "neutral", icon: "TrendingUp" },
                ],
                recentJobs: []
             });
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (isLoading) {
      return (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      );
  }

  if (error) {
      return (
        <div className="p-8 text-center text-red-600 bg-red-50 m-6 rounded-lg border border-red-100">
            <p className="font-semibold">Error loading dashboard</p>
            <p className="text-sm mt-1">{error}</p>
        </div>
      );
  }

  const { stats, recentJobs } = data!;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = iconMap[stat.icon];
          return (
          <div key={stat.name} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-indigo-50 p-3">
                <Icon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-slate-500">{stat.name}</dt>
                  <dd>
                    <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className={clsx(
                "text-sm font-medium",
                stat.changeType === "positive" ? "text-green-600" : 
                stat.changeType === "negative" ? "text-red-600" : "text-slate-500"
              )}>
                {stat.change !== "0" ? (
                    <>
                        {stat.change} <span className="text-slate-500 font-normal">from last month</span>
                    </>
                ) : (
                    <span className="text-slate-400 font-normal">No historical data</span>
                )}
              </div>
            </div>
          </div>
        )})}
      </div>

      {/* Recent Jobs Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Job Postings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Job Title</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Posted</th>
                <th className="px-6 py-3 font-semibold">Applicants</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentJobs.length > 0 ? (
                  recentJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{job.title}</td>
                      <td className="px-6 py-4">{job.type}</td>
                      <td className="px-6 py-4">{job.posted}</td>
                      <td className="px-6 py-4">{job.applicants}</td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
                          job.status === "active" ? "bg-green-100 text-green-800 border-green-200" : 
                          job.status === "closed" ? "bg-slate-100 text-slate-800 border-slate-200" :
                          "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-indigo-600 hover:text-indigo-900 font-medium cursor-pointer">
                        <Link href={`/jobs/${job.id}`}>Edit</Link>
                      </td>
                    </tr>
                  ))
              ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                            <Briefcase className="h-8 w-8 text-slate-300 mb-2" />
                            <p>No jobs posted yet.</p>
                            <Link href="/post-job" className="mt-2 text-indigo-600 hover:text-indigo-500 font-medium">
                                Post a Job
                            </Link>
                        </div>
                    </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-center">
          <Link href="/jobs" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View all jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
