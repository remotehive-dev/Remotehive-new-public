import { CheckCircle2, XCircle, Info, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

const tiers = [
  {
    name: 'Hot Vacancy',
    id: 'hot-vacancy',
    price: '₹1,650',
    gst: '*GST as applicable',
    features: [
      { text: 'Detailed job description', included: true },
      { text: '3 job locations', included: true },
      { text: 'Unlimited applies', included: true },
      { text: 'Applies expiry 90 days', included: true },
      { text: 'Jobseeker contact details visible', included: true, info: true },
      { text: 'Boost on Job Search Page', included: true, info: true },
      { text: 'Job Branding', included: true, info: true },
    ],
    validity: '30 days',
    discount: 'Flat 10% OFF on 5 Job Postings or more',
    buttonText: 'Buy now',
    href: '/sign-in?plan=hot-vacancy',
    hasQuantity: true,
  },
  {
    name: 'Classified',
    id: 'classified',
    price: '₹850',
    gst: '*GST as applicable',
    features: [
      { text: 'Upto 250 character job description', included: true },
      { text: '3 job locations', included: true },
      { text: 'Unlimited applies', included: true },
      { text: 'Applies expiry 90 days', included: true },
      { text: 'Jobseeker contact details visible', included: true, info: true },
      { text: 'Boost on Job Search Page', included: false },
      { text: 'Job Branding', included: false },
    ],
    validity: '30 days',
    discount: 'Flat 10% OFF on 5 Job Postings or more',
    buttonText: 'Buy now',
    href: '/sign-in?plan=classified',
    hasQuantity: true,
  },
  {
    name: 'Standard',
    id: 'standard',
    price: '₹400',
    gst: '*GST as applicable',
    features: [
      { text: 'Upto 250 character job description', included: true },
      { text: '1 job location', included: true },
      { text: '200 applies', included: true },
      { text: 'Applies expiry 30 days', included: true },
      { text: 'Jobseeker contact details visible', included: false, info: true },
      { text: 'Boost on Job Search Page', included: false },
      { text: 'Job Branding', included: false },
    ],
    validity: '15 days',
    discount: 'Flat 10% OFF on 5 Job Postings or more',
    buttonText: 'Buy now',
    href: '/sign-in?plan=standard',
    hasQuantity: true,
  },
  {
    name: 'Free',
    subtitle: 'Job Posting',
    id: 'free',
    price: 'Free',
    isFree: true,
    features: [
      { text: 'Upto 250 character job description', included: true },
      { text: '1 job location', included: true },
      { text: '50 applies', included: true },
      { text: 'Applies expiry 15 days', included: true },
      { text: 'Jobseeker contact details visible', included: false, info: true },
      { text: 'Boost on Job Search Page', included: false },
      { text: 'Job Branding', included: false },
    ],
    validity: '7 days',
    buttonText: 'Post a free job',
    href: '/sign-in?plan=free',
    hasQuantity: false,
  },
];

export function PricingPage() {
  const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:3000';

  return (
    <div className="bg-slate-50 py-12 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-4xl text-center mb-12">
          <h2 className="text-sm font-bold uppercase tracking-wide text-orange-500">JOB POSTING</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Attract candidates
          </p>
          <p className="mt-4 text-lg text-slate-600">
            with quick and easy plans on India's leading job site
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition-shadow"
            >
              <div>
                <div className="mb-4">
                  <h3
                    className={clsx(
                      'text-xl font-medium',
                      tier.isFree ? 'text-green-600' : 'text-blue-600'
                    )}
                  >
                    {tier.name}
                  </h3>
                  {tier.subtitle && (
                    <p className="text-lg text-slate-600">{tier.subtitle}</p>
                  )}
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className={clsx("text-3xl font-bold text-slate-900", tier.isFree && "text-green-600")}>{tier.price}</span>
                  </div>
                  {tier.gst && (
                    <p className="text-xs text-slate-500">{tier.gst}</p>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                    KEY FEATURES
                  </p>
                  <ul role="list" className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        {feature.included ? (
                          <CheckCircle2 className="h-5 w-5 flex-none text-green-500" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-5 w-5 flex-none text-slate-300" aria-hidden="true" />
                        )}
                        <span className={clsx(feature.included ? 'text-slate-700' : 'text-slate-400')}>
                          {feature.text}
                          {feature.info && (
                            <Info className="ml-1 inline-block h-3.5 w-3.5 text-slate-400" />
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 border-y border-dashed border-slate-200 py-3 text-center">
                  <p className="text-sm text-slate-600">
                    Job validity <span className="font-medium text-slate-900">{tier.validity}</span>
                  </p>
                </div>

                {tier.discount && (
                  <div className="mt-4 flex items-center justify-center gap-1 rounded-md bg-slate-50 py-1.5 text-xs font-medium text-slate-600 border border-slate-100">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[10px] text-white">%</span>
                    {tier.discount}
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                {tier.hasQuantity && (
                  <div className="relative">
                    <select
                      className="h-10 w-16 appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      defaultValue="01"
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                          {String(i + 1).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-3 h-4 w-4 text-slate-400" />
                  </div>
                )}
                <a
                  href={`${ADMIN_URL}${tier.href}`}
                  className={clsx(
                    'flex-1 rounded-lg px-3 py-2.5 text-center text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors',
                    'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600'
                  )}
                >
                  {tier.buttonText}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
