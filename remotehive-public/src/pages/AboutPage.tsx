export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold text-slate-900">About RemoteHive</h1>
      <div className="prose prose-lg prose-indigo text-slate-600">
        <p>
          RemoteHive is dedicated to connecting the world's best talent with forward-thinking companies that embrace remote work.
        </p>
        <p>
          We believe that talent is equally distributed, but opportunity is not. Our mission is to bridge that gap by providing a platform where location is no longer a barrier to career growth.
        </p>
        <h2>Our Values</h2>
        <ul>
          <li><strong>Remote First:</strong> We champion the freedom to work from anywhere.</li>
          <li><strong>Transparency:</strong> Clear salary ranges and company details.</li>
          <li><strong>Community:</strong> Building a hive of like-minded professionals.</li>
        </ul>
      </div>
    </div>
  );
}
