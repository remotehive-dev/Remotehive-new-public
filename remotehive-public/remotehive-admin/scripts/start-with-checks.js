const { spawn } = require('child_process');
const http = require('http');

console.log('=== RemoteHive Admin Startup Diagnostic ===');
console.log(`Time: ${new Date().toISOString()}`);
console.log(`Node Version: ${process.version}`);

// 1. Environment Variable Check
const requiredVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('❌ CRITICAL: Missing required environment variables:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.error('The application will likely crash. Please set these in Railway.');
} else {
  console.log('✅ All required environment variables are present.');
}

console.log('--- Environment Dump (Secrets Redacted) ---');
Object.keys(process.env).forEach(key => {
  const value = process.env[key];
  if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD') || key.includes('TOKEN')) {
    console.log(`${key}: ${value ? '********' + value.slice(-4) : '(empty)'}`);
  } else {
    console.log(`${key}: ${value}`);
  }
});
console.log('-------------------------------------------');

// 2. Start Next.js
const port = process.env.PORT || 3000;
console.log(`🚀 Starting Next.js on port ${port} (bound to 0.0.0.0)...`);

const next = spawn('node_modules/.bin/next', ['start', '-H', '0.0.0.0', '-p', port], {
  stdio: 'inherit',
  env: { ...process.env }
});

next.on('error', (err) => {
  console.error('❌ Failed to spawn Next.js process:', err);
  keepAlive();
});

next.on('exit', (code, signal) => {
  console.error(`❌ Next.js process exited with code ${code} and signal ${signal}`);
  if (code !== 0) {
    console.error('⚠️  CRASH DETECTED. Entering Keep-Alive mode for debugging...');
    keepAlive();
  }
});

function keepAlive() {
  console.log('💤 Starting HTTP server on port ' + port + ' to keep container alive for SSH...');
  
  // Create a dummy server to satisfy Railway's health check (if it checks port)
  const server = http.createServer((req, res) => {
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('Service Unavailable - Container in Debug Mode via Trae Check Script\n\nCheck logs for startup errors.');
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`🛡️  Debug Server listening on ${port}. You can now SSH into the container.`);
  });

  // Keep process running indefinitely
  setInterval(() => {
    console.log('... maintaining keep-alive ...');
  }, 60000);
}
