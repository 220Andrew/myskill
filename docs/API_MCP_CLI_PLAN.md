# API, MCP, And CLI

Version: 0.1.0-beta.2
Last updated: 2026-07-13

## Shared Rule

API, web, CLI, and MCP use the same API-owned authorization, sharing, lifecycle, review, and artifact decisions. Client surfaces must not reproduce those policies as substitutes for server checks.

## Implemented API Surface

The Fastify API currently provides:

- health and versioned capability discovery (`GET /health`, `GET /v1/capabilities`);
- email/password, verification, password reset, email change, session, MFA, invitation, and account flows;
- scoped API-token creation/list/revocation and MFA-gated admin token inventory/revocation;
- registration, user/role, provider metadata/mapping, audit, sharing, and team administration;
- public skill search/detail and approved release metadata/bundle delivery;
- authenticated package submission, owned-submission export/withdrawal, maintainer artifact download, hash-attested review/publication, and skill/release lifecycle controls;
- MCP token authorization through `GET /v1/mcp/session`.

[API App](../apps/api/README.md) is the maintained route-level inventory. Public OpenAPI output is planned; it should be generated from, and verified against, implemented route schemas rather than maintained as a second hand-written source.

Browser auth uses token-free login/MFA responses followed by credentialed `myskills_session` cookie requests. CLI and API-token flows use explicit bearer credentials. Metadata browsing does not fetch package contents.

## Planned API Work

- Private draft endpoints separate from submitted versions.
- Provider login/linking and external identity lifecycle.
- Durable background scan/eval run endpoints and safe eval summaries.
- Signed/direct artifact delivery with the same authorization and audit guarantees.
- Generated OpenAPI once route schemas cover the stable beta surface.

## Implemented MCP Surface

The official TypeScript MCP SDK backs:

- a stdio server;
- a stateless Streamable HTTP server;
- `search_skills`;
- `get_skill_info`;
- `get_install_instructions`.

Calls require an API token with `skills:read` through the API-owned MCP session check. Interactive sessions are rejected. HTTP authenticates each request and does not use a shared server token. MCP tools return metadata and install/export guidance, not package contents.

Planned MCP work is limited to role-gated maintainer/admin reads, authoritative per-tool audit events, and broader client compatibility evidence. Write tools remain deferred.

## Implemented CLI Surface

The public `@jarel/myskills` bundle currently supports:

- version, local validate, and local scan;
- local-first API URL config, password/API-key login, MFA completion, logout, auth status, and doctor diagnostics;
- search, info, verified export, local install/list/update/rollback;
- directory or `.zip` submission, owned-submission list/withdrawal;
- maintainer review queue, bundle inspection, and review/publication actions;
- skill metadata/lifecycle and release lifecycle controls;
- team and sharing administration;
- API-token create/list/revoke.

[CLI App](../apps/cli/README.md) is the command-level source of truth. Browser/device login, package init/archive creation, and platform-specific install adapters are planned and should not appear as implemented commands.

The CLI build bundles `packages/skill-package` into `dist/index.js`. The published manifest has no runtime dependency on private `@myskills-app/*` workspaces. `npm run smoke:cli-package` verifies the exact tarball file allowlist, clean temporary install with public dependencies resolved from npm, version output, and example validate/scan behavior.

## Compatibility Targets

- Codex Agent Skills packages are the first supported package target.
- Generic prompt/workflow bundles are the next target.
- Claude, ChatGPT, and other adapters remain planned until package and review rules are stable.

See [Compatibility](COMPATIBILITY.md) for supported runtimes and operating systems.

## Verification

- API and Postgres contract tests cover authorization and lifecycle paths.
- CLI unit tests cover command parsing, auth/config, artifacts, and local install state.
- The public tarball smoke exercises the installed CLI instead of the workspace source.
- MCP initialize, tools/list, tools/call, and HTTP guard tests cover both transports.
- Playwright covers browser routes; Postgres integration tests cover the disposable database path.
- `npm run release:verify` is the canonical beta candidate gate.
