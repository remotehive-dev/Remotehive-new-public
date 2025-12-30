import { AuthenticateWithRedirectCallback } from '../components/AuthComponents';

export function SSOCallbackPage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <AuthenticateWithRedirectCallback 
        signInForceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/onboarding"
      />
    </div>
  );
}
