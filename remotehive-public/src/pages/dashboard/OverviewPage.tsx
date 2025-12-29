import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { getUserByClerkId } from "../../lib/api";

export function OverviewPage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const data = await getUserByClerkId(user.id);
        setProfile(data);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-400 border-t-transparent shadow-neu-flat"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Dashboard Overview</h1>
      <p className="mt-1 text-sm text-gray-500">
        Welcome back, <span className="font-semibold text-purple-600">{profile?.full_name || user?.fullName || 'Job Seeker'}</span>!
      </p>
      
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Quick Stats or Actions */}
        <div className="neu-card p-6 hover:-translate-y-1 transition-transform duration-300">
          <h3 className="text-lg font-bold text-gray-800">Saved Jobs</h3>
          <p className="mt-2 text-4xl font-bold text-purple-500 drop-shadow-sm">0</p>
          <p className="mt-2 text-sm text-gray-500 font-medium">Jobs you've bookmarked</p>
        </div>

        <div className="neu-card p-6 hover:-translate-y-1 transition-transform duration-300">
          <h3 className="text-lg font-bold text-gray-800">Applications</h3>
          <p className="mt-2 text-4xl font-bold text-cyan-500 drop-shadow-sm">0</p>
          <p className="mt-2 text-sm text-gray-500 font-medium">Jobs you've applied to</p>
        </div>

        <div className="neu-card p-6 hover:-translate-y-1 transition-transform duration-300">
          <h3 className="text-lg font-bold text-gray-800">Profile Status</h3>
          <div className="mt-4 flex items-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/50 shadow-neu-pressed px-4 py-1 text-sm font-bold text-green-600 border border-white/50">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Active
            </span>
          </div>
          <p className="mt-3 text-sm text-gray-500 font-medium">Your profile is visible to employers</p>
        </div>
      </div>
    </div>
  );
}
