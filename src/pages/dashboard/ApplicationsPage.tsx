export function ApplicationsPage() {
  return (
    <div className="max-w-6xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-gray-800 tracking-tight">My Applications</h1>
      <p className="mt-1 text-sm text-gray-500">Track the status of your job applications.</p>

      <div className="mt-8 neu-card">
        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-neu-base shadow-neu-pressed p-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-800">No applications yet</h3>
          <p className="mt-2 text-sm text-gray-500">Start applying to jobs to see them here.</p>
          <div className="mt-8">
            <a href="/jobs" className="neu-btn-primary inline-flex items-center">
              Find Jobs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
