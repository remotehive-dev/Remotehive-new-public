"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Briefcase, 
  Building2, 
  Settings, 
  LogOut 
} from "lucide-react";
import { clsx } from "clsx";
import { getUserByClerkId, getCompany } from "../lib/api";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Post a Job", href: "/post-job", icon: PlusCircle },
  { name: "My Jobs", href: "/jobs", icon: Briefcase },
  { name: "Company Profile", href: "/company", icon: Building2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [company, setCompany] = useState<{name: string, logo_url: string} | null>(null);

  useEffect(() => {
    async function fetchCompany() {
      if (user) {
        try {
          const dbUser = await getUserByClerkId(user.id);
          if (dbUser?.company_id) {
            const companyData = await getCompany(dbUser.company_id);
            if (companyData) {
              setCompany({
                name: companyData.name,
                logo_url: companyData.logo_url
              });
            }
          }
        } catch (e) {
          console.error("Failed to load company for sidebar", e);
        }
      }
    }
    fetchCompany();
  }, [user]);

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-auto min-h-16 flex-col items-start justify-center px-6 py-4 border-b border-slate-200 gap-3">
        {/* Main RemoteHive Branding */}
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <img src="/logo.png" alt="RemoteHive" className="h-8 w-8" />
          <span>RemoteHive</span>
        </div>

        {/* Company Branding (if available) */}
        {company && (
          <div className="flex items-center gap-2 pl-1 border-t border-slate-100 pt-3 w-full">
            {company.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={company.name} 
                className="h-6 w-6 rounded object-cover border border-slate-200" 
              />
            ) : (
              <div className="h-6 w-6 rounded bg-slate-100 flex items-center justify-center border border-slate-200">
                <Building2 className="h-3 w-3 text-slate-400" />
              </div>
            )}
            <span className="text-xs font-medium text-slate-600 truncate max-w-[140px]">
              {company.name}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                )}
              >
                <item.icon
                  className={clsx(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-4">
        <button 
          onClick={() => signOut(() => { window.location.href = "/" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-600" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
