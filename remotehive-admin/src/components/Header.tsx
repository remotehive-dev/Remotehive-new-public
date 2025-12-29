"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, User, ChevronDown, LogOut, Settings, Building2 } from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { getUserByClerkId, getCompany } from "../lib/api";

export function Header() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [companyName, setCompanyName] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      if (user) {
        try {
            const dbUser = await getUserByClerkId(user.id);
            if (dbUser?.company_id) {
                const company = await getCompany(dbUser.company_id);
                setCompanyName(company?.name || "No Company");
            }
        } catch (e) {
            console.error(e);
        }
      }
    }
    fetchData();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-800">Employer Dashboard</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={toggleDropdown}
            className="flex items-center gap-3 border-l border-slate-200 pl-4 hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.fullName || user?.primaryEmailAddress?.emailAddress || "User"}</p>
              <p className="text-xs text-slate-500">{companyName || "Loading..."}</p>
            </div>
            <div className="h-9 w-9 overflow-hidden rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="py-1">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{user?.fullName || "User"}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
                
                <Link 
                  href="/company" 
                  className="group flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                  onClick={() => setIsOpen(false)}
                >
                  <Building2 className="mr-3 h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                  Company Profile
                </Link>
                
                <Link 
                  href="/settings" 
                  className="group flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="mr-3 h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                  Settings
                </Link>
                
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => signOut(() => { window.location.href = "/" })}
                    className="group flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-red-600"
                  >
                    <LogOut className="mr-3 h-4 w-4 text-slate-400 group-hover:text-red-600" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
