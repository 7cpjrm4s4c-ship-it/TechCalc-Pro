const JsonContentType = 'application/json; charset=utf-8';
const DefaultGitHubApiBaseUrl = 'https://api.github.com';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return createJsonResponse({ ok: true }, 204);
    }

    const url = new URL(request.url);
    const path = normalizePath(url.pathname);

    try {
      if (request.method === 'GET' && (path === '/' || path === '/health')) {
        return createJsonResponse({ ok: true, service: 'techcalc-blob-transformer' });
      }

      if (request.method !== 'POST') {
        return createJsonResponse({ ok: false, error: 'Method not allowed.' }, 405);
      }

      const payload = await readJson(request);

      if (path === '/transformBlob' || path === '/transform-blob' || hasOperations(payload)) {
        const result = await transformBlob(payload, env);
        return createJsonResponse(result);
      }

      if (path === '/patchBlob' || path === '/patch-blob' || hasPatch(payload)) {
        const result = await patchBlob(payload, env);
        return createJsonResponse(result);
      }

      return createJsonResponse({ ok: false, error: 'Unknown operation.' }, 404);
    } catch (error) {
      return createErrorResponse(error);
    }
  },
};

async function transformBlob(payload, env) {
  validateRepositoryInput(payload);
  validateTransformInput(payload);

  const githubClient = createGitHubClient(env);
  const inputBlob = await githubClient.getBlob(payload.owner, payload.repo, payload.file_sha);
  validateInputBlob(inputBlob, payload);

  const originalContent = decodeBlobContent(inputBlob);
  const transformation = applyOperations(originalContent, payload.operations);
  const response = createTransformationResponse(inputBlob, transformation.content, {
    dryRun: payload.dry_run === true,
    operation: 'transformBlob',
    operationCount: payload.operations.length,
    changed: originalContent !== transformation.content,
    matches: transformation.matches,
  });

  if (payload.dry_run === true) {
    return response;
  }

  const outputEncoding = payload.output_encoding || 'utf-8';
  const createdBlob = await githubClient.createBlob(
    payload.owner,
    payload.repo,
    transformation.content,
    outputEncoding,
  );

  return {
    ...response,
    output_sha: createdBlob.sha,
    output_encoding: outputEncoding,
  };
}

async function patchBlob(payload, env) {
  validateRepositoryInput(payload);
  validatePatchInput(payload);

  const githubClient = createGitHubClient(env);
  const inputBlob = await githubClient.getBlob(payload.owner, payload.repo, payload.file_sha);
  validateInputBlob(inputBlob, payload);

  const originalContent = decodeBlobContent(inputBlob);
  const patchedContent = applyUnifiedDiff(originalContent, payload.patch);
  const response = createTransformationResponse(inputBlob, patchedContent, {
    dryRun: payload.dry_run === true,
    operation: 'patchBlob',
    operationCount: countPatchHunks(payload.patch),
    changed: originalContent !== patchedContent,
    matches: countPatchHunks(payload.patch),
  });

  if (payload.dry_run === true) {
    return response;
  }

  const outputEncoding = payload.output_encoding || 'utf-8';
  const createdBlob = await githubClient.createBlob(
    payload.owner,
    payload.repo,
    patchedContent,
    outputEncoding,
  );

  return {
    ...response,
    output_sha: createdBlob.sha,
    output_encoding: outputEncoding,
  };
}

function applyOperations(content, operations) {
  let nextContent = content;
  let matches = 0;

  for (const operation of operations) {
    if (operation.type === 'replace') {
      const result = replaceAllExact(nextContent, operation.search, operation.replace);
      nextContent = result.content;
      matches += result.matches;
      continue;
    }

    if (operation.type === 'replaceRegex') {
      const result = replaceRegex(nextContent, operation.search, operation.replace, operation.flags);
      nextContent = result.content;
      matches += result.matches;
      continue;
    }

    throw createHttpError(400, `Unsupported operation type: ${operation.type}`);
  }

  return {
    content: nextContent,
    matches,
  };
}

function replaceAllExact(content, search, replacement) {
  if (search === '') {
    throw createHttpError(400, 'Replace search text must not be empty.');
  }

  const parts = content.split(search);
  const matches = parts.length - 1;

  return {
    content: parts.join(replacement),
    matches,
  };
}

function replaceRegex(content, search, replacement, flags) {
  const normalizedFlags = normalizeRegexFlags(flags);
  const regex = new RegExp(search, normalizedFlags);
  const matches = content.match(regex)?.length || 0;

  return {
    content: content.replace(regex, replacement),
    matches,
  };
}

function normalizeRegexFlags(flags) {
  const requestedFlags = flags || '';
  const flagSet = new Set(requestedFlags.split('').filter(Boolean));
  flagSet.add('g');

  return Array.from(flagSet).join('');
}

function applyUnifiedDiff(content, patch) {
  const originalLines = splitLines(content);
  const patchLines = splitLines(patch);
  const outputLines = [];
  let originalIndex = 0;
  let patchIndex = 0;
  let appliedHunks = 0;

  while (patchIndex < patchLines.length) {
    const line = patchLines[patchIndex];

    if (line.startsWith('--- ') || line.startsWith('+++ ') || line === '') {
      patchIndex += 1;
      continue;
    }

    if (!line.startsWith('@@ ')) {
      throw createHttpError(400, `Invalid unified diff line: ${line}`);
    }

    const hunk = parseHunkHeader(line);
    const targetIndex = hunk.oldStart - 1;

    if (targetIndex < originalIndex) {
      throw createHttpError(409, 'Patch hunks overlap or are out of order.');
    }

    while (originalIndex < targetIndex) {
      outputLines.push(originalLines[originalIndex]);
      originalIndex += 1;
    }

    patchIndex += 1;
    appliedHunks += 1;

    while (patchIndex < patchLines.length) {
      const hunkLine = patchLines[patchIndex];

      if (hunkLine.startsWith('@@ ')) {
        break;
      }

      if (hunkLine.startsWith('--- ') || hunkLine.startsWith('+++ ')) {
        break;
      }

      if (hunkLine.startsWith('\\')) {
        patchIndex += 1;
        continue;
      }

      const marker = hunkLine.charAt(0);
      const value = hunkLine.slice(1);

      if (marker === ' ') {
        assertOriginalLine(originalLines, originalIndex, value);
        outputLines.push(originalLines[originalIndex]);
        originalIndex += 1;
        patchIndex += 1;
        continue;
      }

      if (marker === '-') {
        assertOriginalLine(originalLines, originalIndex, value);
        originalIndex += 1;
        patchIndex += 1;
        continue;
      }

      if (marker === '+') {
        outputLines.push(value);
        patchIndex += 1;
        continue;
      }

      throw createHttpError(400, `Invalid unified diff hunk line: ${hunkLine}`);
    }
  }

  if (appliedHunks === 0) {
    throw createHttpError(400, 'Patch does not contain a unified diff hunk.');
  }

  while (originalIndex < originalLines.length) {
    outputLines.push(originalLines[originalIndex]);
    originalIndex += 1;
  }

  return joinLines(outputLines, content.endsWith('\n'));
}

function parseHunkHeader(line) {
  const match = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);

  if (!match) {
    throw createHttpError(400, `Invalid unified diff hunk header: ${line}`);
  }

  return {
    oldStart: Number(match[1]),
    newStart: Number(match[2]),
  };
}

function assertOriginalLine(originalLines, index, expectedLine) {
  const actualLine = originalLines[index];

  if (actualLine !== expectedLine) {
    throw createHttpError(
      409,
      `Patch does not apply at original line ${index + 1}.`,
    );
  }
}

function splitLines(content) {
  const normalizedContent = content.replace(/\r\n/g, '\n');

  if (normalizedContent.endsWith('\n')) {
    return normalizedContent.slice(0, -1).split('\n');
  }

  return normalizedContent.split('\n');
}

function joinLines(lines, hadTrailingNewline) {
  const content = lines.join('\n');

  if (hadTrailingNewline) {
    return `${content}\n`;
  }

  return content;
}

function createGitHubClient(env) {
  const token = env.GITHUB_TOKEN;

  if (!token) {
    throw createHttpError(500, 'GITHUB_TOKEN secret is not configured.');
  }

  const apiBaseUrl = env.GITHUB_API_BASE_URL || DefaultGitHubApiBaseUrl;

  return {
    async getBlob(owner, repo, fileSha) {
      const response = await githubFetch(
        `${apiBaseUrl}/repos/${owner}/${repo}/git/blobs/${fileSha}`,
        token,
      );

      return parseGitHubResponse(response);
    },

    async createBlob(owner, repo, content, outputEncoding) {
      const blobPayload = createBlobPayload(content, outputEncoding);
      const response = await githubFetch(
        `${apiBaseUrl}/repos/${owner}/${repo}/git/blobs`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(blobPayload),
        },
      );

      return parseGitHubResponse(response);
    },
  };
}

async function githubFetch(url, token, init = {}) {
  return fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': JsonContentType,
      'User-Agent': 'techcalc-blob-transformer-worker',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {}),
    },
  });
}

async function parseGitHubResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createHttpError(response.status, payload.message || 'GitHub request failed.');
  }

  return payload;
}

function createBlobPayload(content, outputEncoding) {
  if (outputEncoding === 'utf-8') {
    return {
      content,
      encoding: 'utf-8',
    };
  }

  if (outputEncoding === 'base64') {
    return {
      content: encodeBase64(content),
      encoding: 'base64',
    };
  }

  throw createHttpError(400, 'output_encoding must be either utf-8 or base64.');
}

function decodeBlobContent(blob) {
  if (blob.encoding !== 'base64') {
    throw createHttpError(415, `Unsupported GitHub blob encoding: ${blob.encoding}`);
  }

  return decodeBase64(blob.content || '');
}

function decodeBase64(value) {
  const normalizedValue = value.replace(/\s/g, '');
  const binary = atob(normalizedValue);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw createHttpError(400, 'Request body must be valid JSON.');
  }
}

function validateRepositoryInput(payload) {
  validateRequiredString(payload.owner, 'owner');
  validateRequiredString(payload.repo, 'repo');
  validateRequiredString(payload.file_sha, 'file_sha');

  if (!/^[a-f0-9]{40}$/i.test(payload.file_sha)) {
    throw createHttpError(400, 'file_sha must be a 40-character Git SHA.');
  }
}

function validateTransformInput(payload) {
  if (!Array.isArray(payload.operations) || payload.operations.length === 0) {
    throw createHttpError(400, 'operations must contain at least one operation.');
  }

  for (const operation of payload.operations) {
    validateRequiredString(operation.type, 'operation.type');
    validateRequiredString(operation.search, 'operation.search');

    if (typeof operation.replace !== 'string') {
      throw createHttpError(400, 'operation.replace must be a string.');
    }

    if (operation.type !== 'replace' && operation.type !== 'replaceRegex') {
      throw createHttpError(400, `Unsupported operation type: ${operation.type}`);
    }
  }
}

function validatePatchInput(payload) {
  validateRequiredString(payload.patch, 'patch');
}

function validateInputBlob(inputBlob, payload) {
  if (payload.expected_sha && payload.expected_sha !== inputBlob.sha) {
    throw createHttpError(409, 'Input blob SHA does not match expected_sha.');
  }

  if (typeof payload.expected_size === 'number' && payload.expected_size !== inputBlob.size) {
    throw createHttpError(409, 'Input blob size does not match expected_size.');
  }
}

function validateRequiredString(value, fieldName) {
  if (typeof value !== 'string' || value.length === 0) {
    throw createHttpError(400, `${fieldName} is required.`);
  }
}

function hasOperations(payload) {
  return Array.isArray(payload?.operations);
}

function hasPatch(payload) {
  return typeof payload?.patch === 'string';
}

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function countPatchHunks(patch) {
  const matches = patch.match(/^@@ /gm);

  return matches ? matches.length : 0;
}

function createTransformationResponse(inputBlob, outputContent, metadata) {
  return {
    ok: true,
    service: 'techcalc-blob-transformer',
    operation: metadata.operation,
    dry_run: metadata.dryRun,
    input_sha: inputBlob.sha,
    input_size: inputBlob.size,
    output_size: new TextEncoder().encode(outputContent).length,
    changed: metadata.changed,
    matches: metadata.matches,
    operation_count: metadata.operationCount,
  };
}

function createJsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Content-Type': JsonContentType,
    },
  });
}

function createErrorResponse(error) {
  const status = error.status || 500;

  return createJsonResponse(
    {
      ok: false,
      service: 'techcalc-blob-transformer',
      error: error.message || 'Unexpected error.',
    },
    status,
  );
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;

  return error;
}
