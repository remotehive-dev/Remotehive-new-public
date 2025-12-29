import { UserProfile } from "@clerk/clerk-react";

export function SettingsPage() {
  return (
    <div className="max-w-6xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-gray-800 tracking-tight mb-6">Account Settings</h1>
      <div className="neu-card p-6 overflow-hidden">
        <UserProfile routing="hash" appearance={{
          elements: {
            card: "shadow-none bg-transparent",
            navbar: "hidden",
            pageScrollBox: "p-0",
            rootBox: "w-full"
          }
        }} />
      </div>
    </div>
  );
}
