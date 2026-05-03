# Repository Guidelines

This file provides guidance to AI agents when working with code in this repository.

> **Single source of truth:** This file is a concise pointer document.
> All authoritative architecture, coding rules, commands, and conventions
> live in **CLAUDE.md** at the project root. Read that file first.

## Quick Reference

### Architecture

Go backend + monorepo frontend (pnpm workspaces + Turborepo) with shared packages.

- `server/` — Go backend (Chi router, sqlc, gorilla/websocket)
- `apps/web/` — Next.js frontend (App Router)
- `apps/desktop/` — Electron desktop app
- `packages/core/` — Headless business logic (Zustand stores, React Query hooks, API client)
- `packages/ui/` — Atomic UI components (shadcn/Base UI, zero business logic)
- `packages/views/` — Shared business pages/components
- `packages/tsconfig/` — Shared TypeScript config

### State Management (critical)

- **React Query** owns all server state (issues, members, agents, inbox, workspace list)
- **Zustand** owns all client state (current workspace selection, view filters, drafts, modals)
- All Zustand stores live in `packages/core/` — never in `packages/views/` or app directories
- WS events invalidate React Query — never write directly to stores

### Package Boundaries (hard rules)

- `packages/core/` — zero react-dom, zero localStorage, zero process.env
- `packages/ui/` — zero `@multica/core` imports
- `packages/views/` — zero `next/*`, zero `react-router-dom`, use `NavigationAdapter` for routing
- `apps/web/platform/` — only place for Next.js APIs

### Commands

```bash
make dev              # Auto-setup + start everything
pnpm typecheck        # TypeScript check
pnpm test             # TS unit tests (Vitest)
make test             # Go tests
make check            # Full verification pipeline
```

See CLAUDE.md for the complete command reference.


<claude-mem-context>
# Memory Context

# [Multica] recent context, 2026-05-05 1:03am GMT+5:30

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (17,439t read) | 861,680t work | 98% savings

### May 1, 2026
S3451 Push RBAC implementation to trigger CI/CD deployment to production (May 1 at 11:41 PM)
S3453 Complete RBAC implementation to restrict agent creation and runtime management to admin/owner roles, verify all security gaps are closed, and deploy to production (May 1 at 11:41 PM)
### May 2, 2026
S3455 Investigate existing release workflow configuration for desktop app packaging (May 2 at 9:44 AM)
9696 9:46a 🔵 shivasymbl/forge repository has no GitHub Actions workflow runs
9697 9:47a 🔵 shivasymbl/forge uses Depot CI exclusively, not GitHub Actions
9698 " 🔵 RBAC deployment completed via Depot - two builds finished in under 40 seconds
9699 9:48a 🔵 RBAC deployment verified live in production - containers running sha-a863ede
9700 9:50a 🔵 electron-builder.yml disables DMG signing but enables notarization - conflicting configuration
S3456 Research Depot CI tag trigger configuration to understand why v0.2.23 tag didn't trigger release workflow (May 2 at 9:50 AM)
9701 9:52a 🔵 package.mjs script dynamically disables notarization when Apple credentials absent
9702 " ✅ Switched desktop release runner from Depot to GitHub-hosted macOS
9703 9:53a 🔴 Fixed invalid depot-macos-latest runner label in release workflow
9704 " 🔵 Repository version tags at v0.2.22 - next release would be v0.2.23
9705 9:54a 🔵 Tag v0.2.23 pushed successfully, triggering release workflow with CLI and desktop jobs
9706 " 🔵 Release workflow not yet visible - v0.2.23 release not created after 60+ seconds
9707 9:55a 🔵 Repository has two separate release workflow files - .depot vs .github
9708 9:56a 🔵 shivasymbl/forge repository has no GitHub Actions workflows - uses Depot CI exclusively
9709 " 🔵 Final confirmation - shivasymbl/forge has zero GitHub Actions runs, only v0.1.0 release exists
S3457 Complete investigation of RBAC deployment and release workflow architecture, discovering why v0.2.23 tag didn't trigger automated release (May 2 at 9:56 AM)
9710 9:57a 🔵 Depot CI supports tag push triggers - on.push.tags NOT in unsupported events list
9711 9:58a 🔵 Depot CI lacks CLI commands to list workflow runs - only individual run status check available
9712 " 🔵 shivasymbl/forge is a fork with GitHub Actions enabled but zero workflow runs
9713 9:59a 🔵 GitHub Actions workflows exist and are active but configured for Depot CI - zero GitHub Actions runs
9714 " 🔵 .github/workflows files are stubs pointing to Depot CI - real workflows in .depot/workflows
S3458 Search for existing Depot CI skills or documentation in user's skill library (May 2 at 9:59 AM)
S3459 Research Depot CI tag trigger configuration and event handling (May 2 at 10:00 AM)
S3464 Fix failed v0.2.26 release workflow - macOS DMG build failing on Depot CI due to platform incompatibility (May 2 at 10:00 AM)
9716 10:01a ✅ Workflow change committed and pushed to main
9717 " 🔴 Local macOS DMG build succeeded, produced 4 files
9719 10:23a 🔵 DMG upload to release did not complete after 15 seconds
9720 10:25a 🔵 DMG upload auto-backgrounded despite synchronous invocation
9721 " 🔵 DMG upload fails with HTTP 404 on GitHub releases API
9722 " 🔴 Release v0.2.26 is finalized production release, not draft
9723 10:26a 🔴 DMG upload succeeded with explicit GH_TOKEN authentication
S3463 Fix failed v0.2.26 release workflow - macOS DMG build failing on Depot CI due to platform incompatibility (May 2 at 10:26 AM)
S3465 Fix failed v0.2.26 release workflow - macOS DMG build failing on Depot CI due to platform incompatibility (May 2 at 10:27 AM)
### May 5, 2026
13192 1:00a 🔴 Corrected UI token usage for accessibility and surface consistency
13193 " ✅ Updated active navigation state token
13194 " ✅ Modified chat window background token
13195 " 🔵 SKILL.md file not found in coderabbit plugin cache
13196 " 🔵 Located coderabbit SKILL.md in an alternate cache path
13198 " 🔵 Retrieved coderabbit SKILL.md content
13200 " ✅ Updated project status and progress tracking
13201 " ✅ Integrated Asymbl Brand Style Guide into UI tokens and fonts
13202 " ✅ Updated CI script for patch verification
13203 " ✅ Updated AGENTS.md with new command reference
13204 " ✅ Updated fork-patches.md with new category and items
13205 " 🔵 Reviewed recent Git commit history
13207 " ✅ Refined brand tokens and font application in UI components
13210 1:01a ✅ Updated sidebar styling and active item states
13211 " ✅ Updated sidebar and chat window styling for brand consistency
13212 " ✅ Updated sidebar styling and active item states
13215 " ✅ Updated CSS variables for sidebar colors
13216 " ✅ Refined sidebar navigation item styling
13217 " ✅ Updated chat window container styling
13221 " 🔵 Identified usage of 'text-muted-foreground' and related classes
13222 " 🔵 Identified usage of sidebar and muted foreground classes
13227 " ✅ Reverted sidebar and brand color tokens to previous values
13230 1:02a ✅ Updated styling for draggable pinned sidebar items
13232 " ✅ Updated chat window and message list component structures and styling

Access 862k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>