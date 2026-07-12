# Changelog

All notable user-facing changes will be tracked here. MySkills is still prerelease software; breaking changes may happen between beta releases and will be called out in this file.

## Unreleased

Target release: `v0.1.0-beta.2`.

### Added

- Added reviewer artifact downloads with an approval hash so maintainers approve the exact package payload they inspected.
- Added Chromium browser E2E coverage for cookie-backed web login and localStorage token avoidance.
- Added Postgres coverage for review bundle hashes, approval hash mismatch failures, and legacy approved-row backfill.
- Added production preflight coverage for supported `TRUST_PROXY` values.

### Changed

- Browser auth now uses token-free login/MFA responses plus an HttpOnly `myskills_session` cookie for web sessions; CLI/API-token/MCP flows continue to use bearer credentials.
- Review artifact downloads now save the same compact JSON payload bytes that the approval hash represents.
- The release workflow now runs Playwright browser E2E and Postgres integration tests before release artifact creation.
- Production web builds use same-origin `/api` routing to match the nginx CSP and deployment docs.

### Fixed

- Backfilled approved unpublished submissions with their reviewed artifact hash during migration so existing review rows can still be published.
- Blocked review publication after an approved unpublished release is deleted or archived.
- Exposed the review artifact hash header to allowed cross-origin browser clients.
- Added production proxy trust configuration and validation so auth rate limits use client IPs behind the deployed proxy.
- Added review-queue and artifact/scan join indexes for Postgres review workflows.

## 0.1.0-beta.1 - 2026-06-30

### Fixed

- Updated hosted web, support, security, and contribution copy from public-alpha wording to public-beta wording while keeping hosted signups owner-gated.

## 0.1.0-beta.0 - 2026-06-30

### Added

- Public beta readiness docs for support, contribution, compatibility, and upgrade expectations.
- GitHub issue and pull request templates for public triage.
- Dependabot configuration for npm, GitHub Actions, and Docker manifests.
- Refreshed beta web console UI and design-system components.

### Fixed

- Demo seed data now publishes and repairs `release-notes-helper@0.1.0` so it is visible through public registry reads after `db:seed`.
- SMTP auth notifications disable Nodemailer file and URL access for generated messages.

### Security

- Updated Nodemailer to the patched `9.0.1` line.

## 0.1.0-alpha.3

### Added

- Published the `@jarel/myskills` CLI alpha package with local-first API URL config, keyring-backed credential storage, auth status, doctor diagnostics, and registry workflow commands.

## 0.1.0-alpha.0

### Added

- Initial public alpha repository with API, web, CLI, MCP, package validation/scanning, Postgres migrations, Docker Compose dependencies, release artifact generation, and a public-safe example skill package.
