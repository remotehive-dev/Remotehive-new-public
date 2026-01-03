import { Mail, Phone, Globe, Shield, Users, Zap } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
            <h1 className="mt-10 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Building the Future of <span className="text-indigo-600">Remote Work</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              RemoteHive is dedicated to connecting the world's best talent with forward-thinking companies that embrace remote work. We believe that talent is equally distributed, but opportunity is not. Our mission is to bridge that gap.
            </p>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Our Values</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Why we do what we do
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            We are building a platform where location is no longer a barrier to career growth, fostered by transparency and community.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-slate-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                  <Globe className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Remote First
              </dt>
              <dd className="mt-2 text-base leading-7 text-slate-600">
                We champion the freedom to work from anywhere. We believe work is something you do, not a place you go.
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-slate-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                  <Shield className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Transparency
              </dt>
              <dd className="mt-2 text-base leading-7 text-slate-600">
                No guessing games. We encourage clear salary ranges, detailed company profiles, and open communication.
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-slate-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                  <Users className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Community
              </dt>
              <dd className="mt-2 text-base leading-7 text-slate-600">
                Building a hive of like-minded professionals who support each other in their remote career journeys.
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-slate-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                  <Zap className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                Speed & Quality
              </dt>
              <dd className="mt-2 text-base leading-7 text-slate-600">
                Our platform is designed to connect you with the right opportunities fast, without compromising on quality.
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-slate-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Get in touch</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Have questions or need support? We're here to help you navigate your remote journey.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 text-center sm:mt-20 lg:max-w-none lg:grid-cols-2 lg:text-left">
            <div className="flex flex-col items-center rounded-2xl bg-white p-10 shadow-sm ring-1 ring-slate-200 lg:items-start">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
                <Mail className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold leading-7 text-slate-900">Email Support</h3>
              <p className="mt-2 leading-7 text-slate-600">Our friendly team is here to help.</p>
              <a href="mailto:support@remotehive.in" className="mt-4 text-sm font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
                support@remotehive.in
              </a>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-white p-10 shadow-sm ring-1 ring-slate-200 lg:items-start">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
                <Phone className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold leading-7 text-slate-900">Call Us</h3>
              <p className="mt-2 leading-7 text-slate-600">Mon-Fri from 9am to 6pm IST.</p>
              <a href="tel:+919667791765" className="mt-4 text-sm font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
                +91-9667791765
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
