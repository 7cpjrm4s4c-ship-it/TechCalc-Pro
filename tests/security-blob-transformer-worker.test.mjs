import assert from 'node:assert/strict';
const workerModulePath = '../workers/blob-transformer/src/index.js';
const { default: worker } = await import(workerModulePath);

const env = {
  BLOB_TRANSFORMER_API_TOKEN: 'test-token',
  BLOB_TRANSFORMER_ALLOWED_REPOSITORIES: 'TechCalc-Pro/TechCalc-Pro',
  BLOB_TRANSFORMER_ALLOWED_ORIGINS: 'https://dev.techcalc.local',
  GITHUB_TOKEN: 'github-token',
  GITHUB_API_BASE_URL: 'https://api.github.test'
};

function createRequest(body, headers = {}) {
  return new Request('https://worker.test/transformBlob', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  });
}

function validTransformPayload(overrides = {}) {
  return {
    owner: 'TechCalc-Pro',
    repo: 'TechCalc-Pro',
    file_sha: '0123456789abcdef0123456789abcdef01234567',
    dry_run: true,
    operations: [
      { type: 'replace', search: 'alpha', replace: 'beta' }
    ],
    ...overrides
  };
}

const originalFetch = globalThis.fetch;

try {
  globalThis.fetch = async (url, init = {}) => {
    assert.equal(url, 'https://api.github.test/repos/TechCalc-Pro/TechCalc-Pro/git/blobs/0123456789abcdef0123456789abcdef01234567');
    assert.equal(init.headers.Authorization, 'Bearer github-token');

    return new Response(JSON.stringify({
      sha: '0123456789abcdef0123456789abcdef01234567',
      size: 5,
      encoding: 'base64',
      content: btoa('alpha')
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  {
    const response = await worker.fetch(createRequest(validTransformPayload()), env);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal(payload.error, 'Unauthorized.');
  }

  {
    const response = await worker.fetch(
      createRequest(validTransformPayload(), {
        Authorization: 'Bearer test-token',
        Origin: 'https://evil.example'
      }),
      env
    );
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal(payload.error, 'Origin is not allowed.');
  }

  {
    const response = await worker.fetch(
      createRequest(validTransformPayload({ repo: 'OtherRepo' }), {
        Authorization: 'Bearer test-token'
      }),
      env
    );
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.error, 'Repository is not allowed.');
  }

  {
    const response = await worker.fetch(
      createRequest(validTransformPayload({
        operations: [
          { type: 'replaceRegex', search: '(a+)+', replace: 'b' }
        ]
      }), {
        Authorization: 'Bearer test-token'
      }),
      env
    );
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.match(payload.error, /unsafe nested quantifier/);
  }

  {
    const response = await worker.fetch(
      createRequest(validTransformPayload(), {
        Authorization: 'Bearer test-token',
        Origin: 'https://dev.techcalc.local'
      }),
      env
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://dev.techcalc.local');
    assert.equal(payload.ok, true);
    assert.equal(payload.output_size, 4);
    assert.equal(payload.matches, 1);
  }

  console.log('blob transformer worker security guard ok');
} finally {
  globalThis.fetch = originalFetch;
}
