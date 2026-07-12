# Public Beta Delivery Brief And Acceptance Ledger

Version: 0.1.0-beta.2
Last updated: 2026-07-13

## Goal

Ship MySkills `v0.1.0-beta.2` for real external trial use with a tested local first run, a self-contained public CLI package, explicit compatibility/support/upgrade boundaries, and a reproducible verification-only release workflow.

The beta remains prerelease software. It is not a business-safe production release and does not promise stable APIs, package formats, hosted signup, background processing, backup/restore, or incident-response coverage.

Target release: `v0.1.0-beta.2`.

## Status Language

- **Implemented**: the source, script, test, or document exists in this candidate branch; it is not a claim that default-branch or live proof is current.
- **Candidate proof required**: the final clean commit must produce fresh passing evidence.
- **Live readback required**: GitHub or Railway state must be inspected at approval time; local files are not authoritative.
- **Planned**: outside this beta acceptance boundary.

## Canonical Executable Gate

From a clean candidate checkout with dependencies installed, Chromium installed for Playwright, and `TEST_DATABASE_URL` pointing at a disposable database whose name includes `test` or `ci`, run exactly:

```bash
TEST_DATABASE_URL=postgres://myskills_test:myskills_test@localhost:5432/myskills_test npm run release:verify
```

`release:verify` runs the repo check (including ESLint, builds, web typecheck, unit tests, prerelease policy/version/link checks, and the packed public CLI smoke), route-mocked Playwright tests, a production-like Docker Compose API/web/MinIO/Postgres Playwright journey, disposable Postgres integration tests, and release artifact generation. Release docs may list narrower commands for diagnosis, but this is the single executable beta candidate gate.

The command intentionally fails when the worktree is dirty during final artifact generation. The tag workflow adds tag/version/main-ancestry checks and builds all Dockerfile targets after this gate.

## Acceptance Ledger

| Acceptance area | Required evidence | Candidate state |
| --- | --- | --- |
| Version and release contract | Root/workspace versions, API capability source, changelog target, beta goal, tag expectation, npm prerelease channel, and public dependency publishability agree | Implemented; fresh gate proof required |
| Local onboarding | Fresh clone follows [Getting Started](GETTING_STARTED.md); root `.env` powers migrate, seed, API, web, and MCP dev scripts without shell sourcing | Implemented; fresh-clone API/web smoke required |
| Public CLI package | Tarball contains only `README.md`, `dist/index.js`, and npm-generated `package.json`; clean offline install runs `--version`, example `validate`, and example `scan`; no private runtime workspace dependency | Implemented in `check:prerelease`; fresh gate proof required |
| Static quality | ESLint 10 flat config, TypeScript builds, and explicit web typecheck pass on supported Node 22 and 24 LTS CI jobs | Implemented; default-branch CI readback required |
| Browser and database | Route-mocked Playwright, production-like full-stack Playwright through the nginx/API proxy, and disposable Postgres integration pass on the candidate commit | Candidate proof required |
| Public docs | README, setup, compatibility, API/MCP/CLI, architecture, data model, deployment, Railway, release, roadmap, support, security, contribution, and upgrade docs distinguish implemented/live/planned | Implemented; link/prerelease check required |
| GitHub controls | Required checks protect `main`; tag rules restrict creation/update/deletion; secret scanning, push protection, dependency security updates, and private vulnerability reporting are enabled where available | Live GitHub readback required |
| Distribution artifacts | Verification-only tag workflow confirms tag/version/main ancestry, reruns the canonical gate, builds API/web/MCP HTTP images, and uploads source/checksum metadata without publishing | Implemented; tag-run proof required |
| Staging and user test | Same immutable commit is exercised through local production Compose or a dedicated staging environment; first-run, login/MFA, browse/detail, submit/review/publish, CLI validate/scan/search/export/install, MCP reads, and rollback notes are recorded | Candidate proof and maintainer acceptance required |
| External release actions | Tag push, npm beta publish, GitHub Release creation, container push, and Railway production deploy are separately approved; none is implied by a green local gate | Explicit owner approval required |

## Known Beta Limitations

- Hosted registration remains owner-controlled.
- Provider login/linking is not a complete external identity lifecycle.
- Background package scan jobs and durable eval runs are planned.
- Browser/device-code CLI login and platform-specific install adapters are planned.
- Production backup/restore and incident-response runbooks are not fully rehearsed.
- Container publishing and npm trusted publishing are not configured in the verification workflow.

These limitations are accepted only for external beta trial use. They remain blockers for the later business-safe release.

## Stop Rule

Do not tag or approve publication when any canonical gate step fails, candidate evidence comes from a different commit, live GitHub controls are unverified, staging/user-test evidence is incomplete, or a rollback owner is not named. Fix the candidate or record a narrower replacement release; do not waive the gate through documentation edits.

The staging, approval, tag, publish, production-deploy, and rollback boundaries are defined in [Release Process](RELEASE.md).
