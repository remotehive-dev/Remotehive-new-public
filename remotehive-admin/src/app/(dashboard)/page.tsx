import { Briefcase, Users, Eye, TrendingUp } from "lucide-react";
import { clsx } from "clsx";

const stats = [
  { name: "Active Jobs", value: "12", change: "+2", changeType: "positive", icon: Briefcase },
  { name: "Total Applicants", value: "405", change: "+12%", changeType: "positive", icon: Users },
  { name: "Job Views", value: "3.2k", change: "+4%", changeType: "positive", icon: Eye },
  { name: "Avg. Conversion", value: "12.5%", change: "-1%", changeType: "negative", icon: TrendingUp },
];

const recentJobs = [
  { id: 1, title: "Senior Frontend Engineer", type: "Full-time", posted: "2 days ago", applicants: 45, status: "Active" },
  { id: 2, title: "Product Designer", type: "Contract", posted: "5 days ago", applicants: 12, status: "Active" },
  { id: 3, title: "Backend Developer (Go)", type: "Full-time", posted: "1 week ago", applicants: 89, status: "Closed" },
  { id: 4, title: "Marketing Manager", type: "Full-time", posted: "2 weeks ago", applicants: 23, status: "Active" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-indigo-50 p-3">
                <stat.icon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
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
                stat.changeType === "positive" ? "text-green-600" : "text-red-600"
              )}>
                {stat.change} <span className="text-slate-500 font-normal">from last month</span>
              </div>
            </div>
          </div>
        ))}
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
              {recentJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{job.title}</td>
                  <td className="px-6 py-4">{job.type}</td>
                  <td className="px-6 py-4">{job.posted}</td>
                  <td className="px-6 py-4">{job.applicants}</td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      job.status === "Active" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"
                    )}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-indigo-600 hover:text-indigo-900 font-medium cursor-pointer">
                    Edit
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-center">
          <a href="/jobs" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View all jobs
          </a>
        </div>
      </div>
    </div>
  );
}
