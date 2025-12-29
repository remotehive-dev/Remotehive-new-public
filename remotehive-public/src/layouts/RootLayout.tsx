import { Outlet, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export function RootLayout() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="md:col-span-1">
              <h3 className="text-lg font-bold text-slate-900">RemoteHive</h3>
              <p className="mt-2 text-sm text-slate-500">
                Connecting talented professionals with remote opportunities worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Platform</h4>
              <ul className="mt-2 space-y-2 text-sm text-slate-500">
                <li>Browse Jobs</li>
                <li>Browse Companies</li>
                <li>Pricing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Support</h4>
              <ul className="mt-2 space-y-2 text-sm text-slate-500">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Terms of Service</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Contact</h4>
              <ul className="mt-2 space-y-2 text-sm text-slate-500">
                <li>hello@remotehive.com</li>
                <li>+1 (555) 123-4567</li>
                <li>San Francisco, CA</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-100 pt-8 text-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} RemoteHive. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
