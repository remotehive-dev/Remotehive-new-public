export default function OAuthConsentPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">Authorization Consent</h1>
        <p className="text-slate-600">
          This application is requesting permission to access your account.
        </p>
        <p className="text-sm text-slate-500">
          (Note: This page is a placeholder for Supabase Custom OAuth flow. 
          If you are using standard Clerk authentication, you should not see this.)
        </p>
      </div>
    </div>
  );
}
