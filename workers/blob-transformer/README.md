# TechCalc Blob Transformer Worker

Cloudflare Worker for deterministic GitHub blob transformations used by TechCalc Pro development tooling.

This Worker is a development-only tool. It must not be deployed without the security controls below.

## Endpoints

- `GET /health`
- `POST /transformBlob`
- `POST /patchBlob`

`POST /` also dispatches by payload shape:

- payload with `operations` -> `transformBlob`
- payload with `patch` -> `patchBlob`

## Required secrets and configuration

`GITHUB_TOKEN` must be configured as a Worker secret. The token needs repository access for:

- `GET /repos/{owner}/{repo}/git/blobs/{file_sha}`
- `POST /repos/{owner}/{repo}/git/blobs`

`BLOB_TRANSFORMER_API_TOKEN` must be configured as a separate Worker secret and every `POST` request must use `Authorization: Bearer <token>`.

`BLOB_TRANSFORMER_ALLOWED_REPOSITORIES` must be configured as a comma-separated allowlist, for example:

```text
TechCalc-Pro/TechCalc-Pro
```

`BLOB_TRANSFORMER_ALLOWED_ORIGINS` is optional. If browser access is required, configure an explicit comma-separated origin allowlist. Requests without an `Origin` header continue to work for CLI tooling.

## Deploy

```sh
cd workers/blob-transformer
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put BLOB_TRANSFORMER_API_TOKEN
npx wrangler secret put BLOB_TRANSFORMER_ALLOWED_REPOSITORIES
# Optional for browser clients only:
# npx wrangler secret put BLOB_TRANSFORMER_ALLOWED_ORIGINS
npx wrangler deploy
```

Wrangler configuration is the source of truth for Worker deployment settings.
