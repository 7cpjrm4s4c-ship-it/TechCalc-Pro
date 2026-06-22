# Phase 38H — Netlify npm Registry Fix

## Problem
Netlify failed during dependency installation because `package-lock.json` contained `resolved` URLs pointing to an internal OpenAI Artifactory npm mirror. Netlify cannot access that private/internal registry.

## Fix
- Added project-local `.npmrc` with the public npm registry.
- Rewrote `package-lock.json` `resolved` URLs from the internal Artifactory mirror to `https://registry.npmjs.org/`.
- Added a release guard that fails if private/internal npm registry references are committed again.

## Verification
- No internal registry references remain in npm configuration or package lock data.
- Standard test/build gates pass.
