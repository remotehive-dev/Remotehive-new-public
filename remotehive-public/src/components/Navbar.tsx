import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Briefcase, User } from 'lucide-react';
import { clsx } from 'clsx';
import { SignedIn, SignedOut, UserButton } from './AuthComponents';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const location = useLocation();
  const authDropdownRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Jobs', href: '/jobs' },
    { name: 'Companies', href: '/companies' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (authDropdownRef.current && !authDropdownRef.current.contains(event.target as Node)) {
        setIsAuthOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:3000';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <img className="h-8 w-auto" src="/logo.png" alt="RemoteHive" />
              <span className="text-xl font-bold text-slate-900">RemoteHive</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    location.pathname === item.href
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <SignedIn>
                <Link
                  to="/dashboard"
                  className="mr-4 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <div className="relative" ref={authDropdownRef}>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsAuthOpen(!isAuthOpen)}
                      className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Login / Sign Up
                      <ChevronDown className={clsx("h-4 w-4 transition-transform", isAuthOpen && "rotate-180")} />
                    </button>
                  </div>

                  {/* Auth Dropdown */}
                  {isAuthOpen && (
                    <div className="absolute right-0 mt-2 w-72 origin-top-right divide-y divide-slate-100 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="p-2">
                        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          I am a...
                        </p>
                        
                        <Link
                          to="/sign-in?type=jobseeker"
                          className="group flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-slate-50"
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">Job Seeker</p>
                            <p className="text-xs text-slate-500">Find your dream remote job</p>
                          </div>
                        </Link>

                        <a
                          href={ADMIN_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-slate-50"
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100">
                            <Briefcase className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">Employer</p>
                            <p className="text-xs text-slate-500">Hire top remote talent</p>
                          </div>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </SignedOut>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-md bg-white p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'block rounded-md px-3 py-2 text-base font-medium',
                  location.pathname === item.href
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="border-t border-slate-200 pb-3 pt-4">
            <div className="px-2 space-y-2">
              <p className="px-3 text-xs font-semibold uppercase text-slate-500">Login as</p>
              <Link
                to="/sign-in?type=jobseeker"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <User className="h-5 w-5 text-indigo-500" />
                Job Seeker
              </Link>
              <a
                href={ADMIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <Briefcase className="h-5 w-5 text-purple-500" />
                Employer
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
