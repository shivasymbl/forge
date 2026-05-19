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

# [Multica] recent context, 2026-05-19 5:55pm GMT+5:30

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (15,210t read) | 2,180,394t work | 99% savings

### May 14, 2026
S4670 Summarize progress on Slack integration fixes and related database engineering findings. (May 14 at 11:57 AM)
S4672 Summarize CI results and recent Git operations. (May 14 at 12:14 PM)
S4693 Create and deploy Finance, Business Analyst, and Project Manager agent templates. (May 14 at 12:31 PM)
54664 12:53p 🔴 Finance Analyst Agent Template Created
54670 12:54p 🔴 Business Analyst Agent Template Created
54685 " 🔵 Finance Plugin SKILL.md Descriptions
54695 " 🔵 File Structure of Financial Services Plugins
54704 " 🔵 Claude Plugin Metadata for Finance Agents
54716 " 🔵 File Structure of Model-Builder Skills and PM Skills Repository
54723 12:55p 🔵 Financial Model Skills and PM Skills Structure
54729 " 🔵 Project Management Skills from Phuryn Repository
54736 " 🔵 Key Project Management Skill Descriptions
54677 12:56p 🔵 Contents of Anthropic Financial Services Plugins Directory
S4701 Summarize progress on Asymbl agent template development and CI status. (May 14 at 1:03 PM)
S4703 Summarize progress on Asymbl agent template development, CI status, and skill repository access. (May 14 at 1:35 PM)
S4705 Summarize progress on Asymbl agent template development, CI status, and private skill access verification. (May 14 at 1:37 PM)
S4713 Summarize Anthropic finance plugin inventory and recommend Asymbl templates (May 14 at 1:38 PM)
S4716 Summarize progress on Finance team's skills and plan for automation. (May 14 at 1:43 PM)
S4736 Summarize progress on infrastructure issues and template creation. (May 14 at 1:48 PM)
S4761 Summarize progress on CI checks and code state after recent commits. (May 14 at 5:38 PM)
### May 19, 2026
102886 2:04p 🔵 Current Git Status and Remotes Identified
102877 " ⚖️ Adopted Git Merge for Upstream Sync Over Cherry-Picking
102878 " ⚖️ Local Testing of Migrations Before Production Deployment
102879 " 🔵 Migration Version Key Mismatch Identified
102880 " ✅ Conflict Resolution Strategy for Key Files
102881 " 🟣 Addition of "Browse Templates" Button for Agents
102882 " ✅ Update to `verify-patches.sh` for Template Count
102883 " ✅ Documentation Update for Merge Policy
102884 " ✅ Enhanced Migration SQL Content Verification
102885 " 🔴 Resolved Migration Key Collision Issue
102887 2:05p 🔵 Migration Runner Logic Examined
102889 " 🔵 Patch Verification Script Examined
102890 " 🔵 CLAUDE.md Documentation Reviewed
102892 " 🔵 Patch Verification Script - Test Infrastructure and Summary
102894 " 🔵 CLAUDE.md - Forge Fork Rules
102895 " 🔵 Migrations Directory Resolution and File Handling
102888 2:06p 🔵 Docker Entrypoint Script Analyzed
103042 2:14p 🔵 Migration runner lacks transactional atomicity
103043 " 🔵 Slack API client code is a potential merge conflict risk
103044 " 🔵 Slack RBAC check in verify-patches.sh is structurally weak
103061 " 🔵 packages/core/package.json does not directly indicate Slack conflict risk
103107 " 🔵 Slack API methods added to client.ts in upstream changes
103115 " 🔵 packages/core/package.json updated to include Slack integration exports
103124 " 🔵 Upstream migrations do not consistently use IF NOT EXISTS
103055 " 🔵 Migration runner executes SQL and schema_migrations insert in separate statements
103166 2:15p 🔵 Upstream migration 089_squad_no_action_activity_index.up.sql uses IF NOT EXISTS
103187 " 🔵 Upstream migration 090_task_is_leader.up.sql does not use IF NOT EXISTS
103205 " 🔵 Upstream migration 091_autopilot_webhook_triggers.up.sql uses IF NOT EXISTS
103223 " 🔵 Upstream migration 091_issue_start_date.up.sql does not use IF NOT EXISTS
103242 " 🔵 Upstream migration 091_pr_ci_conflict.up.sql does not use IF NOT EXISTS for ALTER TABLE
103258 " 🔵 Upstream migration 092_pr_stats.up.sql does not use IF NOT EXISTS for ALTER TABLE
103060 " 🔵 packages/core/api/client.ts contains Slack API methods
103266 " 🔵 Upstream migration 093_webhook_deliveries.up.sql uses IF NOT EXISTS for CREATE TABLE
103267 " 🔵 Upstream migration 093_webhook_deliveries.up.sql uses IF NOT EXISTS for CREATE INDEX
103268 " 🔵 Upstream migration 093_webhook_deliveries.up.sql uses IF NOT EXISTS for ALTER TABLE
103276 " 🔵 Upstream migration 094_onboarding_questionnaire_v2.up.sql contains UPDATE statement
103070 " 🔵 Slack API routes in router.go are not consistently wrapped in RBAC middleware
103082 " 🔵 verify-patches.sh check 8.7 confirms Slack routes have RBAC gate
103100 2:16p 🔵 Upstream changes detected in packages/core/api/client.ts and packages/core/package.json
103143 2:17p 🔵 Upstream migration 089_squad_no_action_activity_index.up.sql uses IF NOT EXISTS

Access 2180k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>