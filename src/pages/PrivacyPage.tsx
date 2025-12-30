export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <div className="prose prose-indigo text-slate-600">
        <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2>1. Information Collection</h2>
        <p>
          We collect information from you when you register on our site, subscribe to a newsletter, respond to a survey, fill out a form, or enter information on our site.
        </p>

        <h2>2. Information Usage</h2>
        <p>
          Any of the information we collect from you may be used in one of the following ways:
        </p>
        <ul>
          <li>To personalize your experience and to allow us to deliver the type of content and product offerings in which you are most interested.</li>
          <li>To improve our website in order to better serve you.</li>
          <li>To allow us to better service you in responding to your customer service requests.</li>
        </ul>

        <h2>3. Information Protection</h2>
        <p>
          We implement a variety of security measures to maintain the safety of your personal information when you enter, submit, or access your personal information.
        </p>

        <h2>4. Cookie Usage</h2>
        <p>
          Yes. Cookies are small files that a site or its service provider transfers to your computer's hard drive through your Web browser (if you allow) that enables the site's or service provider's systems to recognize your browser and capture and remember certain information.
        </p>
      </div>
    </div>
  );
}
