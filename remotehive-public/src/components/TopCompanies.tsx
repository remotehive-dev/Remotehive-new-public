import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const COMPANIES = [
  {
    category: 'MNCs',
    count: '2.2K+',
    logos: [
      'https://www.google.com/s2/favicons?domain=google.com&sz=128',
      'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128',
      'https://www.google.com/s2/favicons?domain=amazon.com&sz=128',
      'https://www.google.com/s2/favicons?domain=ibm.com&sz=128',
    ],
    href: '/jobs?type=MNC',
  },
  {
    category: 'Product',
    count: '1.2K+',
    logos: [
      'https://www.google.com/s2/favicons?domain=stripe.com&sz=128',
      'https://www.google.com/s2/favicons?domain=airbnb.com&sz=128',
      'https://www.google.com/s2/favicons?domain=spotify.com&sz=128',
      'https://www.google.com/s2/favicons?domain=uber.com&sz=128',
    ],
    href: '/jobs?type=Product',
  },
  {
    category: 'Banking & Finance',
    count: '433',
    logos: [
      'https://www.google.com/s2/favicons?domain=jpmorgan.com&sz=128',
      'https://www.google.com/s2/favicons?domain=goldmansachs.com&sz=128',
      'https://www.google.com/s2/favicons?domain=citigroup.com&sz=128',
      'https://www.google.com/s2/favicons?domain=wellsfargo.com&sz=128',
    ],
    href: '/jobs?role=Banking',
  },
  {
    category: 'Hospitality',
    count: '104',
    logos: [
      'https://www.google.com/s2/favicons?domain=marriott.com&sz=128',
      'https://www.google.com/s2/favicons?domain=hilton.com&sz=128',
      'https://www.google.com/s2/favicons?domain=hyatt.com&sz=128',
      'https://www.google.com/s2/favicons?domain=airbnb.com&sz=128',
    ],
    href: '/jobs?role=Hospitality',
  },
  {
    category: 'Fintech',
    count: '135',
    logos: [
      'https://www.google.com/s2/favicons?domain=paypal.com&sz=128',
      'https://www.google.com/s2/favicons?domain=squareup.com&sz=128',
      'https://www.google.com/s2/favicons?domain=robinhood.com&sz=128',
      'https://www.google.com/s2/favicons?domain=coinbase.com&sz=128',
    ],
    href: '/jobs?role=Fintech',
  },
];

export function TopCompanies() {
  return (
    <div className="mt-20">
      <h2 className="text-center text-2xl font-bold text-slate-900">Top companies hiring now</h2>
      
      <div className="mt-8 flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
        {COMPANIES.map((item) => (
          <Link
            key={item.category}
            to={item.href}
            className="group relative flex min-w-[280px] flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-indigo-300 hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-1 text-lg font-bold text-slate-900">
                {item.category} <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
              </h3>
            </div>
            <p className="mb-6 text-sm text-slate-500">{item.count} are actively hiring</p>
            
            <div className="flex gap-3">
              {item.logos.map((logo, idx) => (
                <div key={idx} className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100 bg-white p-1 shadow-sm">
                  <img 
                    src={logo} 
                    alt="Company logo" 
                    className="h-full w-full object-contain" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${item.category.charAt(0)}&background=random`;
                    }}
                  />
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
