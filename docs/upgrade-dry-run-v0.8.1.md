# Upgrade dry run: Forge checkout to upstream v0.8.1

Date: 2026-11-10.

Verdict: **NO-GO** for merging v0.8.1 onto `main` or `plan/forge-asymbl-fork`. Both of those branches trigger the Depot deploy workflow and would ship a new image to the production droplet. A second reviewer (watchdog) agreed with that verdict on the dry run. The local branch `sync/upstream-v0.8.1` now holds the merge. It is still not a production candidate. See [Local staging](#local-staging).

This file records the dry run, the 2026-11-10 local staging pass, and the 2026-11-19 fix pass. It does not replace `docs/fork-patches.md`. That file remains the inventory of deliberate Forge patches. Production was not changed. The sync branch is on draft PR #5 and must stay unmerged. `main` was not pushed. No release tag was cut. Doppler was not read.

## What was compared

| Line | Commit | What it is |
| --- | --- | --- |
| Checkout used as the upgrade base | `8b1b7e23196818e51b1fe83940a28bb4f3db8889` on `sync/upstream-v0.4.5` | Local branch, not on GitHub. `v0.4.6` plus Forge commits. `git describe` earlier in this work: `v0.4.6-158-g8b1b7e231`. |
| Local `main` | `003eff7f0e348b04d810bbfaf31932a60ff1990f` (2026-07-21) | One commit ahead of `origin/main`, unpushed. Describe: `v0.3.7-forge-1-g003eff7f0`. |
| `origin/main` | `48f737e512faee96c27e24322d6fca6c490614d5` (2026-06-26) | Last GitHub main: "chore(sync): merge upstream v0.3.31". That merge still had conflict markers. The "87 patches intact" line in the message is not a fresh `verify-patches.sh` run. |
| Upstream tag | `v0.8.1` = `b1ea927def6490c43bedff537b6f4ed9a47fa828` (2026-11-06) | Latest upstream release used for this dry run. Upstream `main` had moved past the tag. Do not treat `upstream/main` as v0.8.1. |

`git rev-list --left-right --count HEAD...v0.8.1` was **154 / 1771** (checkout-only / upstream-only). `v0.4.6` (`9e2cfe098c28c65cbe8193d9b6146bc2aad215e8`, 2026-07-20) is an ancestor of both. The 154 count is SHA divergence, including commits that never existed upstream. It is not 154 unique Forge features.

Local `main` and this checkout are not the same commit. The correct base for the upgrade is this checkout, not `origin/main`.

Working tree at the time of the write: dirty only in `.serena/project.yml`, plus untracked `.enola/`. Those were left alone. `scripts/verify-patches.sh` was read and grepped. It was not executed.

## Depot images

`.depot/workflows/deploy.yml` is named "Build & Deploy Forge".

- Triggers on push to `main` and `plan/forge-asymbl-fork` only. A sync-branch push does not deploy. A push of the merged tree to either trigger branch does.
- Images: `ghcr.io/shivasymbl/forge-backend` and `ghcr.io/shivasymbl/forge-web`. Registry `ghcr.io`. Depot project `kx9jqgpx56`. Dockerfiles `Dockerfile` and `Dockerfile.web`, `linux/amd64`.
- Frontend build args: `NEXT_PUBLIC_API_URL=https://forge.asymbl.app`, `NEXT_PUBLIC_WS_URL=wss://forge.asymbl.app/ws`.
- Tags: short SHA, and `latest` when the branch is the default branch.
- Deploy: SSH to droplet `209.38.78.178` as root. Doppler project `forge`, config `prd`, written to `/root/.env`. `sed` rewrites only `MULTICA_IMAGE_TAG=sha-<short>`. It does not set `MULTICA_BACKEND_IMAGE` or `MULTICA_WEB_IMAGE`.
- Compose is fetched from `https://raw.githubusercontent.com/shivasymbl/forge/<shortSHA>/docker-compose.selfhost.yml`, then `docker compose pull` and `up -d --no-deps` for backend, then frontend. The smoke check against `https://forge.asymbl.app` runs after the containers are already up. A non-200 fails the job. It does not roll the containers back.
- Concurrency group `deploy-${{ github.ref }}`, cancel-in-progress true.

`docker-compose.selfhost.yml` still defaults the image names to upstream:

- backend: `${MULTICA_BACKEND_IMAGE:-ghcr.io/multica-ai/multica-backend}:${MULTICA_IMAGE_TAG:-latest}`
- web: `${MULTICA_WEB_IMAGE:-ghcr.io/multica-ai/multica-web}`
- `RESEND_FROM_EMAIL` defaults to `noreply@multica.ai`

The working tree later changed those image and from-email defaults to Forge. `scripts/verify-patches.sh` checks 14.10 and 14.11 cover the new defaults. The droplet still curls the compose file from the SHA that deploy checks out, and Doppler `prd` was not read, so this edit does not change production.
- `ALLOWED_EMAILS` and `ALLOWED_EMAIL_DOMAINS` default empty

Compose auto-merges with v0.8.1 and those defaults remain. The Go fallback `forge@asymbl.app` applies only when the env var is unset. Compose always sets the env var, so production From-address is whatever Doppler has. The compose fallback is the upstream address.

If Doppler does not set the two image vars, a deploy whose tag was rewritten pulls `ghcr.io/multica-ai/multica-backend:sha-<forge-sha>`. That tag does not exist, so the pull fails. That failure is safe only when the tag was rewritten. If the tag is still `latest` and the image vars are unset, compose pulls upstream `latest`. Doppler contents were not read. The workflow builds Forge images. The running container name is Doppler's, otherwise the upstream default.

Older specs under `docs/spec/active/2026-05-01-forge/` still say `ghcr.io/asymbl/forge-*`. The live workflow uses `ghcr.io/shivasymbl/forge-backend` and `forge-web`. Helm `deploy/helm/multica/values.yaml` and `docker-compose.selfhost.build.yml` still name upstream or `:dev` images. They are not the production path.

`.github/workflows/release.yml` (content-conflicts with v0.8.1) publishes `ghcr.io/${{ github.repository_owner }}/multica-backend` and `multica-web`. On this repo that is `ghcr.io/shivasymbl/multica-backend`, a different name from `forge-backend`. Its GoReleaser job is guarded with `github.repository_owner == 'multica-ai'`, so a Forge tag does not publish the CLI from that GitHub workflow. The Docker jobs are not owner-gated. Helm publish is owner-gated. Neither GitHub nor Depot release workflow SSHes to the droplet. Tag push does not deploy. Depot `release.yml` publishes the CLI with goreleaser `--skip=homebrew`. Depot has no macOS runners, so the desktop DMG stays a local `node scripts/package.mjs --mac --arm64` build.

`.depot/workflows/build-ci-image.yml`, `ci.yml`, and `fork-check.yml` were not fully read. Depot workflows did not appear in the merge-tree conflict output.

## Merge-tree result

Command: `git merge-tree --write-tree --name-only HEAD v0.8.1`. Worktree was not checked out onto the result.

- Computed tree: `1d81592927d620e5faa90e510add367a83e351b1`
- **106 conflicts: 73 content, 33 modify/delete**

Content conflicts that have to be resolved by hand, grouped:

- Release and desktop packaging: `.github/workflows/desktop-smoke.yml`, `.github/workflows/release.yml`, `.goreleaser.yml`, `apps/desktop/package.json`, `apps/desktop/resources/icon.png`, desktop daemon manager, `App.tsx`, daemon settings, `main.tsx`, tab store.
- Brand and landing: `CLAUDE.md`, docs project-resources, login page test, landing about/homepage/layout, auth callback, favicon route, `apps/web/app/layout.tsx`, `not-found.tsx`, CLI/features/footer/header sections, landing i18n `en.ts`, `packages/ui/components/common/multica-icon.tsx`, `packages/ui/styles/tokens.css`.
- Client behavior: `packages/core/api/client.ts`, auth store and test, `packages/core/issues/config/status.ts`, auth initializer, core provider, `packages/core/types/index.ts`, locales (en and zh-Hans) for agents/auth/runtimes/settings, `issue-detail.tsx`, `help-launcher.tsx`, `login-page.test.tsx`, `connect-remote-dialog.tsx`, `runtimes-page.tsx`, `skills-page.tsx`, `pnpm-lock.yaml`, `github-release.ts` and its test.
- Server: `server/cmd/multica/cmd_agent.go`, `cmd_workspace.go`, `server/cmd/server/main.go`, `notification_listeners.go`, `router.go`, `server/internal/cli/config.go`, `daemon_test.go`, execenv files, `prompt.go` and test, `repocache/cache.go`, `server/internal/handler/runtime.go`, builtin skill files that are still present, `builtin_skills_test.go`, `server/pkg/db/generated/models.go`.

`router.go` has one conflict hunk. The checkout side keeps admin/owner gates on `CreateAgent` and `CreateAgentFromTemplate`. The v0.8.1 side posts `CreateAgent` with no role gate and adds `POST /mika` (`CreateMikaAgent`). The resolution has to keep the admin/owner gate on every agent-create route, including `/mika`. Keep `from-template` only if templates stay.

`runtime.go` has two conflict hunks. The four-field strip sits outside those hunks in the result tree (around lines 1280–1292): for a non-admin, clear `Name` (via `stripProviderFromName`), `Provider`, `LaunchHeader`, `DeviceInfo`, and `Metadata`. Do not delete that block while resolving the hunks. `verify-patches.sh` check 2.3 does not assert `LaunchHeader`, `Name`, `Metadata`, or `if !isAdmin`.

`.goreleaser.yml` conflict: the checkout side of the hunk is empty. v0.8.1 adds a `brews:` block publishing formula `multica` to `multica-ai/homebrew-tap`. `project_name: forge` and `binary: forge` sit outside the markers. Keep the checkout side (drop `brews`). Archives are three templates: `forge_{Os}_{Arch}`, versioned `forge-cli-{{ .Version }}-{{ .Os }}-{{ .Arch }}`, and versionless `forge-cli-{os}-{arch}`. Checksums are `checksums.txt`.

`server/pkg/db/generated/models.go` conflicts. The hunk is Forge `WorkspaceSlackIntegration` against upstream `WorkspaceMcpServer` (and a share-link type on the upstream side). Other generated `*.sql.go` files differ and are not in the conflict list. Taking one side drops types the other side's queries use. After SQL is merged, regenerate with `make sqlc`. Do not hand-merge `models.go`.

### Modify/delete

Upstream modified files this checkout deleted. Merge-tree left the v0.8.1 bytes. Re-apply the Forge mark:

- 11 icon files under `apps/desktop/build/` (`icon.icns`, `icon.ico`, `icon.png`, and the 16–512 png sizes)
- `apps/web/public/favicon.svg`

Check 1.3 looks for the Asymbl mark in the renderer, not in these files.

Upstream deleted files this checkout modified. Merge-tree left the checkout copy. Those greps still pass until the deletion is accepted. Port the gates onto the v0.8.1 replacements, then delete the orphans:

- `packages/views/agents/components/agent-creation-studio.tsx` (checks 2.6, 2.10)
- `packages/views/layout/app-sidebar.tsx` and its test (check 2.9)
- `packages/views/onboarding/steps/step-agent.tsx`
- `packages/views/settings/components/github-tab.tsx` (check 7.2b)
- `packages/views/settings/components/integrations-tab.tsx` and its test
- Builtin skills upstream removed: autopilots, creating-agents, mentioning, projects-and-resources, runtimes-and-repos, skill-importing source map, squad source map, working-on-issues, each with its source map where one exists

`server/internal/agenttmpl` is absent from the v0.8.1 tag (`git cat-file -e v0.8.1:server/internal/agenttmpl` fails: path exists on disk, not in the tag). Checks 9.1–9.10 fail closed once that directory is actually gone. That failure is the desired signal if templates are dropped. If templates are kept, retarget the checks. The raw merge-tree keeps the directory until the modify/delete is accepted, so 9.x can still pass on an uncommitted merge that has not deleted it.

On 2026-11-19 the live gates were moved onto the v0.8.1 pages and the orphan view files in that list were deleted. See [Fix pass 2026-11-19](#fix-pass-2026-11-19).

### Silent auto-merges

These files auto-merged with no `CONFLICT` line. A clean auto-merge is not proof the Forge behavior survived:

- `docker-compose.selfhost.yml`
- `docker/entrypoint.sh` (backfill then migrate order was still present in the checkout file; watchdog said the auto-merge kept `./backfill_task_usage_hourly` before `./migrate up`)
- `scripts/install.sh`
- `server/cmd/multica/cmd_daemon.go`
- `server/internal/daemon/daemon.go`
- `server/internal/handler/daemon.go`
- root `package.json` and `packages/core/package.json`

`apps/desktop/package.json` both auto-merges and content-conflicts. `go.mod` and `Dockerfile` were not in the conflict list.

PAT registration in the result tree of `server/internal/handler/daemon.go`: the non-`mdt_` branch still calls `requireWorkspaceRole(..., "owner", "admin")`. The `mdt_` branch is the other arm (workspace-id match, owner binding, Qoder-managed daemon id). Check 2.4 only greps for the role string somewhere in the file, so it passes if that string survives outside the registration path. Re-read the function after a real merge.

Result-tree `server/go.mod` is `go 1.26.9`. Module path stays `github.com/multica-ai/multica/server`. This checkout's `server/go.mod` is `go 1.26.1`. `Dockerfile` is `FROM golang:1.26-alpine` (floating tag).

## Migrations

The migration version key is the full basename without `.up.sql` (the same key is used for `.down.sql`). See `server/cmd/migrate/main.go`. Health readiness counts `schema_migrations` rows whose `version` is in the set of versions the binary ships (`server/cmd/server/health.go`, `migrations.AllVersions()`). A missing version fails health.

Filenames do not collide, so git does not conflict:

| Side | 202 | 203 |
| --- | --- | --- |
| This checkout | `202_workspace_slack_integrations` | `203_slack_created_by_fk_fix` |
| v0.8.1 | `202_runtime_profile_add_qwen` | `203_issue_workspace_assignee_index` |

Both pairs land. Sort order is `202_runtime_profile_add_qwen`, `202_workspace_slack_integrations`, `203_issue_workspace_assignee_index`, `203_slack_created_by_fk_fix`. Independent SQL should both apply. This is not a primary-key collision on `schema_migrations.version`. Production already has the Forge slack versions applied. A new binary also requires the upstream 202/203 names and every later migration. Those run on startup. Later upstream SQL that assumes a schema this fork diverged from can still fail. The existing Forge foreign key (`created_by` to user) already breaks the fork's "no FK" rule. Do not drop it as part of this upgrade, and do not renumber the slack files unless the SQL itself conflicts.

No migration file was in the 106 conflict lines. An earlier count of `server/migrations` was 488 files on this checkout and 1280 on v0.8.1. That count was not repeated on the final pass. Test the migrate on a scratch copy of production, not on production.

## CLI and daemons on other machines

Three names are in play, and they do not meet.

| Piece | What it does today |
| --- | --- |
| Goreleaser archives | `forge_{os}_{arch}`, versioned `forge-cli-*`, versionless `forge-cli-*`. Binary name inside the archive is `forge`. |
| `scripts/install.sh` | `REPO_URL` is `shivasymbl/forge`. Comment says brew package `shivasymbl/forge/forge` and that no brew tap exists yet, then the script still tries `brew tap shivasymbl/forge` and falls back to the GitHub tarball. Download URL is `https://github.com/shivasymbl/forge/releases/download/${latest}/forge-cli-${latest}-${OS}-${ARCH}.tar.gz`. User-facing strings still say "Installing Multica CLI". install.sh auto-merges. Checks 13.2–13.6 grep the forge URL and `forge setup`. A string can survive while the download URL changes. |
| `server/internal/cli/update.go` | `releaseAssetCandidates` looks only for versioned and versionless `forge-cli-*`. It does not look for `forge_{os}_{arch}`. `fetchReleaseByTag` and `FetchLatestRelease` hardcode `https://api.github.com/repos/multica-ai/multica/releases/...`. The extracted binary name is `forge` / `forge.exe`. |

Upstream v0.8.1 release assets are `multica-cli-0.8.1-{os}-{arch}` and legacy `multica_{os}_{arch}`, plus desktop dmg/exe. There is no `forge-cli-*` asset. `forge update` against upstream fails closed. It does not install the upstream binary.

The latest `shivasymbl/forge` GitHub release is `v0.3.7-forge`, published 2026-06-26T17:56:56Z, with `forge-cli-*` and `forge_{os}_{arch}` assets. A fresh `install.sh` from GitHub `main` today still hands out that June binary. `forge update` will not see a future Forge release until `update.go` points at `shivasymbl/forge`.

Auto-update defaults on only when the server host is `api.multica.ai`, unless `MULTICA_DAEMON_AUTO_UPDATE` is set. `forge.asymbl.app` does not match, so other machines do not auto-update. Leave that unset.

No protocol-version constant was found under `server/**/*.go` (`ProtocolVersion`, `protocol_version`, `DaemonProtocol`, `apiVersion`). Compatibility of `v0.3.7-forge` daemons with a v0.8.1 server was not tested. Do not assume old daemons keep working. Sequence: staging server, one daemon, then the rest, and only after a Forge release exists that matches the server. Rebranded desktop apps need a new local DMG after the merge. That is separate from the droplet image.

The daemon source path is still `server/cmd/multica/`. The product name and the path are different. The Go module path `github.com/multica-ai/multica/server` stays.

## verify-patches.sh

87 `check` lines. Not executed in this dry run.

What fails closed once the file is actually deleted: 2.6, 2.10, 2.9, 7.2b, and 9.1–9.10 if `agenttmpl` is removed. On this merge-tree those files are still present, so the greps still pass.

What fails if the Forge side of a conflict is dropped: 1.5 `ALLOWED_EMAIL_DOMAINS` in `router.go`; 2.1 `POST /api/agents` gate; 2.3 partial runtime strip; 6.2, 6.3, 8.6, 8.7 slack hook and router gates in `notification_listeners.go` and `router.go`; 5.1 `tokens.css`; 7.4 and 7.5 desktop `package.json`; 7.10 `not-found`; 7.14 `prompt.go`; 12.x landing; 13.2–13.4 connect-remote dialog; 1.9 status Archive label.

What can pass while the behavior is gone, because the check is a string or a file-exists test:

- 2.4 PAT admin gate (string anywhere in `daemon.go`)
- 11.1 and 11.2 entrypoint order (string)
- 3.1 `POSTHOG_API_KEY` (string)
- 13.6 install.sh URL string
- 3.3 is only `test -f .depot/workflows/deploy.yml`
- Check 2.1 can match `RequireWorkspaceRole` on the checkout side of the `router.go` conflict while the upstream side of the same hunk is an ungated `r.Post("/", h.CreateAgent)`
- Nothing in the script reads `update.go`

Checks to add before calling the upgrade done. Not written in this dry run:

- `update.go` fetches `shivasymbl/forge`, not `multica-ai/multica`
- `deploy.yml` image names stay `ghcr.io/shivasymbl/forge-backend` and `forge-web`
- `CreateAgent` and `CreateMikaAgent` are both inside `RequireWorkspaceRole`
- runtime strip clears all four fields under `if !isAdmin`
- PAT path still calls `requireWorkspaceRole`; `mdt_` path does not
- goreleaser has no `homebrew-tap` and the binary stays `forge`
- sidebar, agent-create, and GitHub checks point at the post-0.8 files
- slack `202_workspace_slack_integrations` and `203_slack_created_by_fk_fix` exist beside the upstream 202/203 names
- `server/go.mod` is `go 1.26.9`
- `next` is at least `^16.4.5` (this checkout is `^16.2.5`; staying there keeps GHSA-673q-mjm6-r5xr / MUL-8585)
- compose defaults, or the Doppler vars the deploy relies on, do not point at `ghcr.io/multica-ai`

## Toolchain

| Item | This checkout | v0.8.1 / merge result |
| --- | --- | --- |
| `server/go.mod` | `go 1.26.1` | Result tree is `go 1.26.9`. Not a conflict. Merge-base was also 1.26.1. |
| `apps/web` Next | `^16.2.5` | `^16.4.5` |
| `Dockerfile` | `golang:1.26-alpine` (floating) | Not in the conflict list. Pin `1.26.9` in the same change as the go.mod bump. |
| CI as documented in `CLAUDE.md` | Node 22, Go 1.26.1, `pgvector/pgvector:pg17` | Go version in the doc will be stale after the bump. `.github/workflows/release.yml` reads `go-version-file: server/go.mod` and content-conflicts. |
| Postgres image | `pgvector/pgvector:pg17` in self-host compose | Unchanged by this dry run. |

## Sequence, when someone is allowed to do the real merge

The list below is the dry-run plan. The local merge and the isolated staging pass are recorded in [Local staging](#local-staging). Do not treat this list as unfinished work that should be repeated from step 0.

0. Do not push to `main` or `plan/forge-asymbl-fork`. Either push builds images and deploys the droplet.
1. Base is this checkout, `sync/upstream-v0.4.5` at `8b1b7e231`, not `origin/main`.
2. If a remote is needed, publish that base only to a branch the deploy workflow ignores.
3. Branch `sync/upstream-v0.8.1` and merge tag `v0.8.1`. Expect 106 conflicts (73 content, 33 modify/delete).
4. Resolve: admin/owner gate on every agent-create route including `/mika`; keep the four-field runtime strip; drop goreleaser `brews`; keep Forge on landing, tokens, email domain, `ALLOWED_EMAIL_DOMAINS`, install.sh URL, and entrypoint order. Take upstream Next `16.4.5`, Go `1.26.9`, and the new migrations. Pin the Docker builder to `golang:1.26.9`.
5. Re-read the auto-merged files: `handler/daemon.go`, `daemon.go`, `cmd_daemon.go`, `install.sh`, `docker/entrypoint.sh`, `docker-compose.selfhost.yml`.
6. Port sidebar, agent-studio, and GitHub co-author gates onto the replacement files. Delete the orphans after the gates have a new home.
7. Leave the slack migration filenames. Run `make sqlc` after the SQL is resolved. Do not hand-merge `models.go`.
8. Add the verify checks listed above. Run `bash scripts/verify-patches.sh`, Go tests, and `pnpm typecheck`. Do not deploy.
9. Restore a production snapshot to a scratch database and migrate. Health must pass with both 202/203 pairs recorded.
10. Change `update.go` to `shivasymbl/forge` before any CLI release. Cut that release from the sync branch's Depot tag workflow only after the branch builds. Point one daemon at staging. Leave `MULTICA_DAEMON_AUTO_UPDATE` unset. Protocol compatibility is untested. Desktop DMG is a separate local build.
11. Confirm Doppler `prd` sets `MULTICA_BACKEND_IMAGE=ghcr.io/shivasymbl/forge-backend` and `MULTICA_WEB_IMAGE=ghcr.io/shivasymbl/forge-web` before any push to `main`. Only then consider `main`.

## Watchdog

Reviewer: general-purpose subagent `01a1c492-92bb-7971-a5a3-a5071d3055f7`. Overall: NO-GO. No second review was run.

| Claim | Result |
| --- | --- |
| 106 conflicts; six files auto-merge; `router.go` and `runtime.go` conflict; sidebar, agent studio, and github-tab are modify/delete | Agree |
| Migration version key is the filename; both 202/203 pairs coexist; health counts `schema_migrations` | Agree |
| Depot deploy images, triggers, droplet, tag-only env edit; compose defaults are upstream; tag workflows do not SSH | Agree |
| install.sh, `update.go` URLs, `forge-cli` asset names, v0.8.1 `multica-cli` assets, `v0.3.7-forge`, auto-update host | Disagree on one detail: goreleaser archives are three templates (`forge_{os}_{arch}`, versioned `forge-cli-*`, versionless `forge-cli-*`). The binary is `forge`. `update.go` still only looks for `forge-cli-*`. The rest holds. |
| 87 checks; install.sh and deploy.yml existence; `update.go` not checked; deleted-file checks | Agree, with the correction that merge-tree keeps those files, so the greps still pass until the deletion is accepted |
| Go 1.26.9 vs 1.26.1, Next 16.4.5 vs 16.2.5, Dockerfile floating 1.26, `go.mod` not in the conflict list | Agree. Result tree `go.mod` is `go 1.26.9` |
| Push to `main` or `plan/forge-asymbl-fork` deploys production and is unsafe | Agree |

Missed risk the watchdog added: hand-merging `models.go`. That is sequence step 7.

## What this dry run did not prove

These bullets describe the dry run only. Later checks are in [Local staging](#local-staging).

- `scripts/verify-patches.sh` was not executed.
- Doppler on the droplet was not read. Production image identity is "the workflow builds Forge; the runtime name is Doppler, otherwise the upstream default."
- Daemon protocol compatibility was not tested.
- A scratch-database migrate was not run. Filename coexistence does not prove the SQL succeeds on a database that already has the Forge slack tables.
- The two spot checks do not prove the whole auto-merge of `daemon.go` and `install.sh` is behavior-preserving.
- `.depot/workflows/build-ci-image.yml`, `ci.yml`, and `fork-check.yml` were not read. Depot `release.yml` was read through the CLI job header. GitHub `release.yml` was read through the start of the Docker job. The helm owner-gate line was reported by the watchdog.
- No branch was created. HEAD remained `sync/upstream-v0.4.5` at `8b1b7e231`.

## Local staging

Checked on 2026-11-10 after the dry run. Branch `sync/upstream-v0.8.1` merges tag `v0.8.1` (`b1ea927def6490c43bedff537b6f4ed9a47fa828`) into the previous checkout `8b1b7e231`. Real conflict markers are resolved. The remaining `<<<<<<<` hits are fixtures in `server/internal/daemon/execenv/local_worktree_test.go`.

Production was not migrated. As of this 2026-11-10 pass, nothing was pushed. No tag was cut. Doppler was not read. Caddy on port 8080 was left running. The shared local Postgres container named `postgres` was left running. No other database on it was dropped. The sync branch was pushed later, on 2026-11-19, as draft PR #5. `main` was not part of that push.

### Isolated database

This checkout is the main checkout, so `make setup`, `make start`, `make setup-worktree`, and `make start-worktree` are the wrong starters. They call `scripts/ensure-postgres.sh`, which runs `docker compose up -d postgres` and tries to bind port 5432. That bind failed because the existing container already owns 5432. The leftover container `multica-postgres-1` never started and was left in status Created.

`.env.staging` is gitignored. API is `http://localhost:18884`. Web is `http://localhost:13804`. `APP_ENV` is unset, so the dev JWT default does not trip the production boot check. Stop this stack only with `make stop ENV_FILE=.env.staging`.

Role `multica` was created on the existing container as a local superuser so the migrations can install extensions. Database `multica_forge_staging_081_804` was created empty. `go run ./cmd/migrate up` printed `Done.` and exited 0. This is a fresh database. No production snapshot was restored.

Both version pairs are applied:

- `202_runtime_profile_add_qwen`
- `202_workspace_slack_integrations`
- `203_issue_workspace_assignee_index`
- `203_slack_created_by_fk_fix`

`446_issue_properties_bigm_index` was skipped because operator class `gin_bigm_ops` (`pg_bigm`) is not installed on `pgvector/pgvector:pg17`. Versions 139, 140, and 469 were skipped by the migrator as retired or superseded.

After the browser pass, `GET /readyz` returned 200 `{"status":"ok","checks":{"db":"ok","migrations":"ok"}}`. `GET http://localhost:13804/login` returned 200. The login page talks to port 18884.

### Commands that ran

| Command | Result |
| --- | --- |
| `bash scripts/verify-patches.sh` | 98 passed, 0 failed, "All Forge patches intact." |
| `cd server && go build ./...` | exit 0 |
| `cd server && go test ./internal/cli -count=1 -timeout 180s` | exit 0 |
| `pnpm install` | exit 0 |

`pnpm install` printed peer warnings (electron-vite vs Vite 8, fumadocs vs Next 16, packages/ui esbuild). They were not treated as failures.

Not run on 2026-11-10: `pnpm typecheck` (run on 2026-11-19; see [Fix pass 2026-11-19](#fix-pass-2026-11-19)), `make sqlc`, `make test`, the repocache `cache_test` / `identity_test` packages, a daemon protocol check, and a desktop DMG build.

`verify-patches.sh` greps source. A green run does not prove every live UI gate. On 2026-11-10, check 2.9 looked for `isWorkspaceAdmin` in `packages/views/layout/app-sidebar.tsx`. The switcher that rendered in the browser is `packages/views/layout/rail-workspaces.tsx`. On 2026-11-19 check 2.9 was retargeted to that file and the orphan sidebar was deleted.

`server/pkg/db/generated/models.go` was hand-closed for the Slack, WorkspaceMcpServer, and WorkspaceShareLink conflicts, then gofmt'd. `make sqlc` was not run. The server binary builds from that tree. `server/internal/handler/agent_template.go` needed a compile fix (`h.agentToResponse` and a `context.Context` on the template skill fetchers) before `go build ./...` passed.

Dockerfile builder is `golang:1.27.3-alpine`. `server/go.mod` is `go 1.26.9`. Check 14.7 covers `go.mod`. The dry-run note to pin the Dockerfile at `1.26.9` was not applied. `apps/web` Next is `^16.4.5` (check 14.8).

Home CLI config and daemon profiles resolve under `~/.forge`. Worktree sidecar `.multica` and `~/.multica/hooks` were left unchanged.

### Browser

Verified in the user's Chrome through browser-harness. The database is empty of customer data. A screenshot was not the check.

Owner `forge-staging-owner@asymbl.app` (`aaf9f64e-f437-4120-94c8-fc90073704e0`) signed in, skipped profile and Mika, and created workspace Forge Staging (`bddd1eb5-78f7-4ed4-9877-767f1ed6ab65`, slug `forge-staging`, prefix `FORG`). The app landed on FORG-1 (`01a1c547-f318-7a96-9548-193cf2d6baf9`). Visible sign-in copy is "Sign in to Forge". Page titles use ` | Forge`. Favicon links are `/brand/favicon.png` and `/brand/apple-touch-icon.png`. The owner stayed on `/forge-staging/runtimes`. Creating the member invitation returned 201.

Member `forge-staging-member@asymbl.app` (`2d26a8c4-730e-4686-8d32-9428c3b0af10`, role `member`) signed in on a fresh session, checked the invitation row, and clicked "Join 1 workspace". Accept of invitation `77b00a8b-e360-4d77-bbd6-289e50b61b70` returned 200. Onboarding complete returned 200. The page settled on `/forge-staging/issues` with title `Issues | Forge`.

Member gates:

- `/forge-staging/runtimes` was served (`GET` 200, direct navigation and the sidebar link). The client then returned to `/forge-staging/issues`. The owner session had stayed on that page.
- Observed on 2026-11-10, before the gate move: `/forge-staging/agents/new` stayed open, title `Create Agent | Forge`. The Qoder row shows "Ask an admin to connect". "Connect a machine" was still on the page. At that time the control was not behind `canManage` in `packages/views/agents/create/runtime-choice-list.tsx`.
- From the member session, `POST /api/agents`, `POST /api/agents/mika`, and `POST /api/agents/from-template` each returned 403 `insufficient permissions`.
- `POST /api/runtimes` returned 405. The collection route only registers `GET /`.
- The four-field runtime strip was not observed live. The staging database has no runtime rows. The strip is in `server/internal/handler/runtime.go` and check 14.5 greps it.
- Observed on 2026-11-10, before the gate move: the open workspace switcher shows a "Create workspace" menuitem whose href is `/workspaces/new`. `rail-workspaces.tsx` rendered it when workspace creation is enabled, with no admin check. `app-sidebar.tsx` still gated the same label on `isWorkspaceAdmin`. The member did not follow the link.

### Copy left as upstream in this pass

- Onboarding "About you" still asks "What do you want to use Multica for?"
- Seeded FORG-1 still says "Welcome to Multica", links `https://multica.ai/docs/install-agent-runtime`, and tells the reader to run `multica daemon restart`.
- The runtimes empty state still shows an upstream install snippet and `multica setup` beside a sentence that says to run `forge setup`.
- Landing privacy copy in `ja.ts`, `ko.ts`, and `zh.ts` still says Multica. English landing copy was a conflict and is Forge.
- Some non-conflict agent prompts and recognizers still say `multica issue`. The binary name is `forge`. A repo-wide rewrite was not started. Workdir `.multica` stays.

### Still open after the 2026-11-10 pass

These bullets describe the tree before the 2026-11-19 fix. The current list is [Still open after the fix pass](#still-open-after-the-fix-pass).

The local merge was on `sync/upstream-v0.8.1` and, on that day, was not pushed. It was already **NO-GO** for `main` and `plan/forge-asymbl-fork`.

- Member UI still offered Create workspace and Connect a machine. The three agent-create POSTs returned 403.
- Leftover Multica command strings and the three non-English landing privacy blocks.
- `make sqlc`, `pnpm typecheck`, and the full Go suite had not been run.
- Dockerfile builder remains `golang:1.27.3-alpine` while `go.mod` is 1.26.9.
- No production-snapshot migrate. pg_bigm index 446 did not build on this image.
- Doppler `prd` image variables are unknown.
- Protocol of installed `v0.3.7-forge` daemons against this server was not tested. No CLI release was cut. `MULTICA_DAEMON_AUTO_UPDATE` stays unset. Desktop DMG remains a local `node scripts/package.mjs --mac --arm64` build.

## Fix pass 2026-11-19

`pnpm typecheck` on the post-merge tree failed in `@multica/views`. Upstream v0.8.1 had removed types, locale keys, and sibling modules that the kept Forge files still imported. `runtime-detail-page.tsx` called `navigation.push` on the DOM `Navigation` global. `create-agent-dialog.tsx` imported `AgentTemplate`, which core no longer exports.

The live gates were moved, then the dead files were deleted:

- Create workspace: `packages/views/layout/rail-workspaces.tsx` hides the link unless the current member role is `owner` or `admin`. While the member list is loading, the link stays hidden. `app-sidebar.tsx` and its test were deleted.
- Connect a machine: `packages/views/agents/create/runtime-choice-list.tsx` renders that button only when `canManage` is true. `choose-runtime-page.tsx` already sets `canManage` from owner or admin.
- Co-author trailer text: `packages/views/settings/components/code-tab.tsx` shows `Co-authored-by: forge-agent <github@asymbl.com>`. `github-tab.tsx` was deleted.
- `runtime-detail-page.tsx` calls `useNavigation()` from `packages/views/navigation`.
- `create-agent-dialog.tsx` takes `templateSeed` as name, description, and instructions.
- Also deleted, because nothing live imported them and their dependencies are gone: `agent-creation-studio.tsx`, `onboarding/steps/step-agent.tsx`, `editor/attachment-block.tsx` and its test, and `settings/components/integrations-tab.tsx` and its test. The agent settings tab at `packages/views/agents/components/tabs/integrations-tab.tsx` stayed.

`scripts/verify-patches.sh` checks 2.6, 2.9, 2.10, and 7.2b now grep the live files. Check 2.11 greps the Connect a machine `canManage` guard. `docs/fork-patches.md` sections 2.6 and 2.9 and the CLAUDE.md RBAC cell point at the same files. The creating-agents source map no longer cites `step-agent.tsx`.

### Commands on 2026-11-19

| Command | Result |
| --- | --- |
| `pnpm typecheck` | exit 0. Turbo 2.9.5, 9 of 9 tasks, filter `!@multica/mobile`. |
| `pnpm --filter @multica/views exec vitest run layout/rail-workspaces.test.tsx agents/create/runtime-choice-list.test.tsx` | exit 0. 2 files, 20 tests. |
| `bash scripts/verify-patches.sh` | 99 passed, 0 failed. |

The 2026-11-10 observations above describe the tree before this gate move. The same-day browser re-check is below.

Merge commits `1d7554dec` and `41fda1aed` are on `origin/sync/upstream-v0.8.1` as draft PR #5 (https://github.com/shivasymbl/forge/pull/5). The gate move is `a81049e12` on that same branch. Do not merge the PR. `origin/main` is still `48f737e512fa`.

### Browser re-check 2026-11-19

Staging was restarted with `make api-dev ENV_FILE=.env.staging` and `make web-dev ENV_FILE=.env.staging` against the existing database `multica_forge_staging_081_804`. API port 18884, web port 13804. Docker Desktop had stopped, so the first owner Continue click got `500 failed to lookup user`. After Docker and the shared `postgres` container were back, `GET /readyz` returned 200 and sign-in worked. Nothing was clicked that creates a workspace, connects a machine, or downloads the desktop app.

Member `forge-staging-member@asymbl.app`, titles ending in `| Forge`:

- Workspace switcher menu was Forge Staging only. No Create workspace item.
- `/forge-staging/agents/new` (`Create Agent | Forge`) had no Connect a machine button. The Qoder row said "Ask an admin to connect".

Owner `forge-staging-owner@asymbl.app`:

- Account menu showed `forge-staging-owner@asymbl.app`.
- Workspace switcher included Create workspace, href `/workspaces/new`.
- `/forge-staging/agents/new` showed Connect a machine. "Ask an admin to connect" was absent.
- `/forge-staging/runtimes` stayed on that URL (`Runtimes | Forge`) and showed Add runtime. The body was the empty-state carousel, so the runtime four-field strip was not checked against a real runtime row.

Leftover copy seen on that carousel, left as-is: the install snippet still names `multica`, and a button is labeled Ask Multica.

### Still open after the fix pass

Verdict remains **NO-GO** for `main` and `plan/forge-asymbl-fork`. Merging draft PR #5 deploys the droplet.

- Browser re-check of those two controls passed on the restarted staging stack. See [Browser re-check 2026-11-19](#browser-re-check-2026-11-19). The runtime four-field strip still has no live runtime row.
- Leftover Multica command strings and the three non-English landing privacy blocks.
- `make sqlc` and the full Go suite. `go build ./...` and `go test ./internal/cli` from 2026-11-10 were not re-run.
- Depot runner labels in `.depot/workflows/ci.yml` and `deploy.yml` still say `depot-ubuntu-24.04-4`.
- Dockerfile builder remains `golang:1.27.3-alpine` while `go.mod` is 1.26.9.
- No production-snapshot migrate. pg_bigm index 446 did not build on this image.
- Doppler `prd` image variables were not read.
- Protocol of installed `v0.3.7-forge` daemons against this server was not tested. No CLI release was cut.
