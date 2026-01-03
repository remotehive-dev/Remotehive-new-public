import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUserByClerkId } from "../lib/api";

export default function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkUser() {
      if (!isUserLoaded) return;

      // If user is not logged in, we don't need to check onboarding
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        const dbUser = await getUserByClerkId(user.id);
        const isOnboardingPage = location.pathname === '/onboarding';
        
        if (dbUser) {
          // User exists in DB (Onboarded)
          if (isOnboardingPage) {
            // If they are on onboarding page but already onboarded, send them to dashboard
            navigate('/dashboard');
          } else {
            // Otherwise, let them proceed
            setIsChecking(false);
          }
        } else {
          // User does NOT exist in DB (Not Onboarded)
          if (!isOnboardingPage) {
            // If not on onboarding page, force redirect to onboarding
            navigate('/onboarding', { replace: true });
            // Keep isChecking true so we don't render children
          } else {
            // If already on onboarding page, let them proceed
            setIsChecking(false);
          }
        }
      } catch (err) {
        console.error("Error checking user onboarding status:", err);
        // If error (e.g. network), assume NOT onboarded to be safe
        if (location.pathname !== '/onboarding') {
           navigate('/onboarding', { replace: true });
        } else {
           setIsChecking(false);
        }
      }
    }

    checkUser();
  }, [user, isUserLoaded, location.pathname, navigate]);

  // Show loader while checking
  // ONLY if we are logged in. If not logged in, we set isChecking=false immediately above.
  if (isChecking && user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
