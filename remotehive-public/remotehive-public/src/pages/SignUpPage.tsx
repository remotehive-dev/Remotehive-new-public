import { SignUp } from '@clerk/clerk-react';

export function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <SignUp 
        path="/sign-up" 
        routing="path" 
        signInUrl="/sign-in" 
        fallbackRedirectUrl="/onboarding"
      />
    </div>
  );
}
