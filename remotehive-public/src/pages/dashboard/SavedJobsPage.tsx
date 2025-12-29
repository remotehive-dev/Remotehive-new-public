export function SavedJobsPage() {
  return (
    <div className="max-w-6xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Saved Jobs</h1>
      <p className="mt-1 text-sm text-gray-500">Jobs you've bookmarked for later.</p>

      <div className="mt-8 neu-card">
        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-neu-base shadow-neu-pressed p-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-800">No saved jobs</h3>
          <p className="mt-2 text-sm text-gray-500">Bookmark jobs to view them here later.</p>
          <div className="mt-8">
            <a href="/jobs" className="neu-btn-primary inline-flex items-center">
              Browse Jobs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
