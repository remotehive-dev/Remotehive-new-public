"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getUserByClerkId } from "../lib/api";
import { Loader2 } from "lucide-react";

export default function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkUser() {
      // Wait for Clerk to load
      if (!isUserLoaded) return;

      // If not logged in, let Clerk middleware handle it (or redirect to sign-in)
      if (!user) {
        setIsChecking(false);
        return;
      }

      // If already on onboarding page, stop checking
      if (pathname === '/onboarding') {
        setIsChecking(false);
        return;
      }

      try {
        const dbUser = await getUserByClerkId(user.id);
        
        // If user not found in DB or has no company_id, redirect to onboarding
        if (!dbUser || !(dbUser as any).company_id) {
          router.push('/onboarding');
        } else {
          setIsChecking(false);
        }
      } catch (err) {
        console.error("Error checking user onboarding status:", err);
        // Fallback: assume new user if error (e.g. 404)
        router.push('/onboarding');
      }
    }

    checkUser();
  }, [user, isUserLoaded, pathname, router]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return <>{children}</>;
}
