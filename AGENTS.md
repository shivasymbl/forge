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

# [Multica] recent context, 2026-05-19 2:14pm GMT+5:30

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (20,155t read) | 2,417,526t work | 99% savings

### May 14, 2026
S4670 Summarize progress on Slack integration fixes and related database engineering findings. (May 14 at 11:57 AM)
S4672 Summarize CI results and recent Git operations. (May 14 at 12:14 PM)
S4693 Create and deploy Finance, Business Analyst, and Project Manager agent templates. (May 14 at 12:31 PM)
54491 12:49p 🔵 Agent Template Handler Files
54499 " 🔵 Agent Template Package Location
54489 " 🔵 Agent Template Schema Search
54504 " 🔵 Agent Template Definitions and Loading Logic
54507 " 🔵 Agent Template Examples: Full-Stack Engineer and Planner
54512 " 🔵 Writing Agent Templates: Article Writer and Docs Writer
54571 12:50p 🔵 Skills Directory Contents in `anthropics/skills`
54577 " 🔵 Skill Descriptions for Document Manipulation
54583 " 🔵 Skills Directory Contents in `obra/superpowers-skills`
54591 " 🔵 Sub-skills within `obra/superpowers-skills` Categories
54593 " 🔵 Sub-skill Categories in `obra/superpowers-skills`
54598 " 🔵 Contents of Anthropic Skills Directories
54604 12:51p 🔵 Anthropic Skill Descriptions (SKILL.md)
54609 " 🔵 Superpowers Skills Descriptions (SKILL.md)
54613 " 🔵 Superpowers Skills Descriptions (SKILL.md) - Remaining Skills
54617 " 🔵 Claude Agent Skills for Finance, Tax, SaaS, and Document Workflows
54570 " 🔵 Skills Directory Structure in `obra/superpowers-skills`
54623 12:52p 🔵 Claude Agent Skills for Business Analysis Tasks
54627 " 🔵 Claude Agent Skills for Project Management
54631 " 🔵 Contents of Anthropic Financial Services Plugins Directory
54642 " 🔵 Claude Skills for Indian GST and ITR Filing
54651 12:53p 🔵 Contents of Anthropic Financial Services Plugins Subdirectories
54658 " 🔵 Skill Importer Logic in skill.go
54664 " 🔴 Finance Analyst Agent Template Created
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

Access 2418k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>