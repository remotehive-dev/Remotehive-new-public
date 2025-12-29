import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  BookmarkCheck, 
  Briefcase, 
  FileText, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  Settings, 
  Sparkles, 
  UserCircle, 
  Building2,
  X
} from 'lucide-react';
import { UserButton, useClerk, useUser } from '@clerk/clerk-react';
import { clsx } from 'clsx';

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', href: '/dashboard/profile', icon: UserCircle },
    { name: 'Build Resume', href: '/dashboard/resume-builder', icon: FileText },
    { name: 'My Applications', href: '/dashboard/applications', icon: Briefcase },
    { name: 'Saved Jobs', href: '/dashboard/saved-jobs', icon: BookmarkCheck },
    { name: 'Apply New Jobs', href: '/dashboard/apply-jobs', icon: Sparkles },
    { name: 'Companies', href: '/dashboard/companies', icon: Building2 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen text-neu-text">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-white/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white/40 backdrop-blur-xl shadow-neu-flat transition-transform duration-300 lg:translate-x-0 border-r border-white/50",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Sidebar Header - Replaced Logo with User Profile */}
          <div className="flex h-24 items-center justify-between px-6">
            <Link to="/dashboard" className="flex items-center gap-3 w-full group">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/50 shadow-neu-flat border-2 border-white/70 overflow-hidden transition-transform group-hover:scale-105">
                <img 
                  className="h-full w-full object-cover" 
                  src={user?.imageUrl || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=random`} 
                  alt={user?.fullName || 'User'} 
                />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-gray-800 tracking-tight truncate group-hover:text-purple-600 transition-colors">
                  {user?.fullName || 'Job Seeker'}
                </span>
                <span className="text-xs text-gray-500 font-medium truncate">
                  View Dashboard
                </span>
              </div>
            </Link>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full bg-white/50 shadow-neu-flat text-gray-500 active:shadow-neu-pressed ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-3 px-4 py-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white/60 shadow-neu-pressed text-purple-700"
                      : "text-gray-600 hover:bg-white/40 hover:shadow-neu-flat hover:-translate-y-0.5"
                  )}
                >
                  <item.icon className={clsx(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-purple-600" : "text-gray-400 group-hover:text-purple-600"
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4">
            <div className="flex items-center gap-3 rounded-xl bg-neu-base shadow-neu-pressed p-4 border border-white/20">
              <UserButton appearance={{
                elements: {
                  avatarBox: "h-10 w-10 shadow-neu-flat rounded-full"
                }
              }}/>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-bold text-gray-800">My Account</p>
                <button 
                  onClick={() => signOut()}
                  className="mt-1 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-neu-accent transition-colors"
                >
                  <LogOut className="h-3 w-3" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-72 transition-all duration-300">
        {/* Top Header for Mobile */}
        <div className="sticky top-0 z-30 flex h-16 items-center gap-x-4 bg-neu-base px-4 shadow-neu-flat sm:gap-x-6 sm:px-6 lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">Dashboard</div>
          <UserButton />
        </div>

        <main className="py-8 bg-neu-base min-h-screen">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
