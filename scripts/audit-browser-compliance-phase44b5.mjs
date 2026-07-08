import fs from 'node:fs';

const fail = (message) => {
  console.error(`[phase44b5-browser-compliance] ${message}`);
  process.exit(1);
};

const headers = fs.readFileSync('_headers', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

const cspLine = headers.split(/\r?\n/).find((line) => line.includes('Content-Security-Policy:'));
if (!cspLine) fail('Missing Content-Security-Policy in _headers.');

const requiredDirectives = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://formspree.io",
  "frame-src 'self' https://app.netlify.com",
  "child-src 'self' https://app.netlify.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://formspree.io",
  "frame-ancestors 'none'"
];

for (const directive of requiredDirectives) {
  if (!cspLine.includes(directive)) fail(`Missing CSP directive: ${directive}`);
}

if (index.includes('name="mobile-web-app-capable"')) {
  fail('Deprecated mobile-web-app-capable meta tag must not be present.');
}

if (!index.includes('name="apple-mobile-web-app-capable" content="yes"')) {
  fail('Missing iOS standalone meta tag apple-mobile-web-app-capable.');
}

if (manifest.display !== 'standalone') {
  fail('manifest.json display must remain standalone.');
}

if (manifest.scope !== './' || manifest.start_url !== './#/heating-cooling') {
  fail('manifest scope/start_url changed unexpectedly.');
}

console.log('[phase44b5-browser-compliance] OK');
