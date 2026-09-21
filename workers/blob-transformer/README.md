# TechCalc Blob Transformer Worker

Cloudflare Worker for deterministic GitHub blob transformations used by TechCalc Pro tooling.

## Endpoints

- `GET /health`
- `POST /transformBlob`
- `POST /patchBlob`

`POST /` also dispatches by payload shape:

- payload with `operations` -> `transformBlob`
- payload with `patch` -> `patchBlob`

## Required secret

`GITHUB_TOKEN` must be configured as a Worker secret. The token needs repository access for:

- `GET /repos/{owner}/{repo}/git/blobs/{file_sha}`
- `POST /repos/{owner}/{repo}/git/blobs`

## Deploy

```sh
cd workers/blob-transformer
npx wrangler secret put GITHUB_TOKEN
npx wrangler deploy
```

Wrangler configuration is the source of truth for Worker deployment settings.
