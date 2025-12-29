import { Sidebar } from "../../components/Sidebar";
import { Header } from "../../components/Header";
import OnboardingCheck from "../../components/OnboardingCheck";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingCheck>
      <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </OnboardingCheck>
  );
}
