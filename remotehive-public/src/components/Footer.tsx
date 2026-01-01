import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { djangoApiUrl } from '../lib/api';

interface FooterConfig {
  description: string;
  email: string;
  phone: string;
  address: string;
  copyright: string;
  links: {
    platform: Array<{ label: string; url: string }>;
    support: Array<{ label: string; url: string }>;
    legal?: Array<{ label: string; url: string }>;
    social?: Array<{ label: string; url: string }>;
  };
}

export function Footer() {
  const [config, setConfig] = useState<FooterConfig | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(djangoApiUrl('/api/home-config/'));
        if (res.ok) {
          const data = await res.json();
          if (data.footer) {
            setConfig(data.footer);
          }
        }
      } catch (err) {
        console.error("Failed to load footer config", err);
      }
    }
    loadConfig();
  }, []);

  const currentYear = new Date().getFullYear();
  
  // Fallback defaults if API fails or config is missing
  const description = config?.description || "Connecting talented professionals with remote opportunities worldwide.";
  const email = config?.email || "support@remotehive.in";
  const phone = config?.phone || "+91-9667791765";
  const address = config?.address || "San Francisco, CA";
  const copyright = config?.copyright || "RemoteHive. All rights reserved.";
  
  const platformLinks = config?.links?.platform || [
    { label: "Browse Jobs", url: "/jobs" },
    { label: "Browse Companies", url: "/companies" },
    { label: "Pricing", url: "/pricing" },
  ];

  const supportLinks = config?.links?.support || [
    { label: "Help Center", url: "/help" },
    { label: "Contact Us", url: "/contact" },
    { label: "Terms of Service", url: "/terms" },
  ];

  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold text-slate-900">RemoteHive</h3>
            <p className="mt-2 text-sm text-slate-500">
              {description}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Platform</h4>
            <ul className="mt-2 space-y-2 text-sm text-slate-500">
              {platformLinks.map((link, idx) => (
                <li key={idx}>
                  <Link to={link.url} className="hover:text-indigo-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Support</h4>
            <ul className="mt-2 space-y-2 text-sm text-slate-500">
              {supportLinks.map((link, idx) => (
                <li key={idx}>
                  <Link to={link.url} className="hover:text-indigo-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">Contact</h4>
            <ul className="mt-2 space-y-2 text-sm text-slate-500">
              <li>
                <a href={`mailto:${email}`} className="hover:text-indigo-600 transition-colors">{email}</a>
              </li>
              <li>
                <a href={`tel:${phone}`} className="hover:text-indigo-600 transition-colors">{phone}</a>
              </li>
              <li>{address}</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-100 pt-8 text-center text-sm text-slate-500">
          <p>&copy; {currentYear} {copyright}</p>
        </div>
      </div>
    </footer>
  );
}
