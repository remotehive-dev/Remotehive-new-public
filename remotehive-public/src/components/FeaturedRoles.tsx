import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const ROLES = [
  { name: 'Full Stack Developer', count: '23.3K+', href: '/jobs?role=Full+Stack' },
  { name: 'Mobile / App Developer', count: '2.9K+', href: '/jobs?role=Mobile' },
  { name: 'Front End Developer', count: '5.6K+', href: '/jobs?role=Front+End' },
  { name: 'DevOps Engineer', count: '3K+', href: '/jobs?role=DevOps' },
  { name: 'Engineering Manager', count: '1.7K+', href: '/jobs?role=Engineering+Manager' },
  { name: 'Technical Lead', count: '12.2K+', href: '/jobs?role=Technical+Lead' },
];

export function FeaturedRoles() {
  return (
    <div className="mx-auto mt-20 max-w-7xl rounded-3xl bg-orange-50 p-8 sm:p-12 lg:p-16">
      <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
        {/* Left Side: Illustration & Text */}
        <div className="flex-1 text-center lg:text-left">
          <div className="mx-auto mb-6 h-48 w-48 lg:mx-0">
            {/* Simple vector illustration placeholder */}
            <svg viewBox="0 0 200 200" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" className="fill-white opacity-50" />
              <path d="M60 140 L60 100 A40 40 0 0 1 140 100 L140 140" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
              <circle cx="100" cy="70" r="20" stroke="#1e293b" strokeWidth="4" />
              <circle cx="130" cy="50" r="15" className="fill-orange-400 opacity-80" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Discover jobs across popular roles</h2>
          <p className="mt-4 text-lg text-slate-600">Select a role and we'll show you relevant jobs for it!</p>
        </div>

        {/* Right Side: Grid of Roles */}
        <div className="flex-1">
          <div className="grid gap-4 sm:grid-cols-2">
            {ROLES.map((role) => (
              <Link
                key={role.name}
                to={role.href}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">{role.name}</h3>
                  <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                    {role.count} Jobs <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
