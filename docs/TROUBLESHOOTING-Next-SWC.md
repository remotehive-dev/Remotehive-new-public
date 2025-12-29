# Troubleshooting: Next.js SWC Binary on macOS (darwin/arm64)

## Symptom
- Error `Failed to load SWC binary for darwin/arm64` when running `next dev`.
- Often occurs when project is inside cloud-synced folders.

## Fixes
- Reinstall SWC:
  - `npm rebuild @next/swc-darwin-arm64`
  - `rm -rf node_modules && npm install`
- Move project out of cloud-synced folders (e.g., Google Drive) to a local path.
- Ensure Node.js version is supported by Next.js 14.
- If still failing, set `NEXT_DISABLE_SWC_LOAD_WARNING=1` and use a local path.

## Recommendation
- Use a local workspace directory for Next.js projects to avoid binary file corruption by sync tools.

