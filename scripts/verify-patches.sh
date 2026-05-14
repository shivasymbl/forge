#!/usr/bin/env bash
# verify-patches.sh — verify all Forge fork patches are still in place.
# Run locally: bash scripts/verify-patches.sh
# Run in CI:   .depot/workflows/fork-check.yml
# Exit 0 = all patches intact. Non-zero = list failed checks.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PASS=0
FAIL=0
FAILURES=()

check() {
  local desc="$1"
  local cmd="$2"
  if eval "$cmd" &>/dev/null; then
    echo "  ✓  $desc"
    PASS=$((PASS + 1))
  else
    echo "  ✗  $desc"
    FAILURES+=("FAIL: $desc")
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "=== Forge Fork Patch Verification ==="
echo ""

# ── 1. Brand / Identity ──────────────────────────────────────────────────────
echo "[ 1 ] Brand / Identity"
check "1.1 Desktop .env.production points to forge.asymbl.app" \
  "grep -q 'forge.asymbl.app' apps/desktop/.env.production"

check "1.2 Electron appId is com.asymbl.forge" \
  "grep -q 'com.asymbl.forge' apps/desktop/electron-builder.yml"

check "1.3 Asymbl mark PNG bundled in renderer/public" \
  "test -f apps/desktop/src/renderer/public/brand/asymbl-mark.png"

check "1.4 Desktop login page reads app URL from self-host runtime config" \
  "grep -q 'requireRuntimeAppUrl\|runtimeConfig' apps/desktop/src/renderer/src/pages/login.tsx"

check "1.5 router.go reads ALLOWED_EMAIL_DOMAINS env var (plural, not singular)" \
  "grep -q 'ALLOWED_EMAIL_DOMAINS' server/cmd/server/router.go"

check "1.6 Email service defaults to forge@asymbl.app" \
  "grep -q 'forge@asymbl.app' server/internal/service/email.go"

check "1.7 Web layout: metadataBase is forge.asymbl.app" \
  "grep -q 'forge.asymbl.app' apps/web/app/layout.tsx"

check "1.8 Web layout: no Multica brand strings" \
  "! grep -q '\"Multica' apps/web/app/layout.tsx"

check "1.9 Archive label replaces Cancelled in status config" \
  "grep -q '\"Archive\"' packages/core/issues/config/status.ts"

echo ""

# ── 2. RBAC ──────────────────────────────────────────────────────────────────
echo "[ 2 ] RBAC"
check "2.1 router.go: POST /api/agents gated to admin/owner" \
  "grep -q 'RequireWorkspaceRole.*CreateAgent\|CreateAgent.*RequireWorkspaceRole' server/cmd/server/router.go"

check "2.3 runtime.go: provider stripped for non-admins" \
  "grep -q 'Provider = \"\"' server/internal/handler/runtime.go"

check "2.3 runtime.go: device_info stripped for non-admins" \
  "grep -q 'DeviceInfo = \"\"' server/internal/handler/runtime.go"

check "2.3 runtime.go: stripProviderFromName helper exists" \
  "grep -q 'stripProviderFromName' server/internal/handler/runtime.go"

check "2.4 daemon.go: PAT path uses requireWorkspaceRole" \
  "grep -q 'requireWorkspaceRole.*owner.*admin' server/internal/handler/daemon.go"

check "2.5 permissions/rules.ts: canCreateAgent defined" \
  "grep -q 'canCreateAgent' packages/core/permissions/rules.ts"

check "2.6 agents-page: isAdmin prop threaded to PageHeaderBar" \
  "grep -q 'isAdmin={isWorkspaceAdmin}' packages/views/agents/components/agents-page.tsx"

check "2.7 runtimes-page: non-admin redirect" \
  "grep -q 'navigation.push' packages/views/runtimes/components/runtimes-page.tsx"

check "2.8 runtime-detail-page: non-admin redirect" \
  "grep -q 'navigation.push' packages/views/runtimes/components/runtime-detail-page.tsx"

check "2.9 app-sidebar: Create workspace gated by isWorkspaceAdmin" \
  "grep -q 'isWorkspaceAdmin' packages/views/layout/app-sidebar.tsx"

echo ""

# ── 3. Infrastructure ─────────────────────────────────────────────────────────
echo "[ 3 ] Infrastructure"
check "3.1 docker-compose.selfhost.yml: POSTHOG_API_KEY wired" \
  "grep -q 'POSTHOG_API_KEY' docker-compose.selfhost.yml"

check "3.2 .goreleaser.yml: homebrew-tap removed" \
  "! grep -q 'homebrew-tap' .goreleaser.yml"

check "3.3 Depot CI deploy workflow exists" \
  "test -f .depot/workflows/deploy.yml"

echo ""

# ── 4. Analytics ──────────────────────────────────────────────────────────────
echo "[ 4 ] Analytics"
check "4.1 PostHog session recording enabled" \
  "grep -q 'disable_session_recording: false' packages/core/analytics/index.ts"

check "4.1 PostHog exception capture enabled" \
  "grep -q 'capture_exceptions: true' packages/core/analytics/index.ts"

echo ""

# ── 5. Design System ──────────────────────────────────────────────────────────
echo "[ 5 ] Design System"
check "5.1 tokens.css: warm paper background (#fafaf7)" \
  "grep -q 'fafaf7' packages/ui/styles/tokens.css"

check "5.1 tokens.css: forest green success token (#1f6d3a)" \
  "grep -q '1f6d3a' packages/ui/styles/tokens.css"

check "5.1 tokens.css: warm beige border (#e8e6de)" \
  "grep -q 'e8e6de' packages/ui/styles/tokens.css"

check "5.2 web layout: Fraunces is the brand serif (not Source Serif 4)" \
  "grep -q 'Fraunces' apps/web/app/layout.tsx"

check "5.2 desktop: Fraunces fontsource import" \
  "grep -q 'fraunces' apps/desktop/src/renderer/src/main.tsx"

echo ""

# ── 6. Slack Integration ──────────────────────────────────────────────────────
echo "[ 6 ] Slack Integration"

check "6.1 Slack integration package exists" \
  "test -f server/internal/integrations/slack/notify.go"

check "6.2 Slack hook wired in notification_listeners" \
  "grep -q 'slack.NotifyStatusChange' server/cmd/server/notification_listeners.go"

check "6.3 Slack routes have admin RBAC gate in router" \
  "grep -q 'integrations/slack' server/cmd/server/router.go && \
   grep -q 'RequireWorkspaceRole' server/cmd/server/router.go"

check "6.4 Slack DB migration exists" \
  "ls server/migrations/*_workspace_slack_integrations.up.sql > /dev/null 2>&1"

echo ""

# ── 7. Brand Audit (B1-B10) ───────────────────────────────────────────────────
echo "[ 7 ] Brand Audit (B1-B10)"

check "7.1 co-authored-by hook: forge-agent identity" \
  "grep -q 'forge-agent <github@asymbl.com>' server/internal/daemon/repocache/cache.go"

check "7.2 co-authored-by hook: no multica-agent in hook script" \
  "! grep -q 'multica-agent <github@multica.ai>' server/internal/daemon/repocache/cache.go"

check "7.3 desktop app.setName is Forge" \
  "grep -q 'app.setName(\"Forge\")' apps/desktop/src/main/index.ts"

check "7.4 desktop package.json productName is Forge" \
  "node -e \"const p=require('./apps/desktop/package.json'); process.exit(p.productName==='Forge'?0:1)\""

check "7.5 no multica.ai in desktop package.json" \
  "! grep -q 'multica.ai' apps/desktop/package.json"

check "7.6 runtimes-page has no multica.ai external link" \
  "! grep -q 'multica.ai' packages/views/runtimes/components/runtimes-page.tsx"

check "7.7 ACP client name is forge-agent-sdk (codex + hermes)" \
  "grep -q 'forge-agent-sdk' server/pkg/agent/codex.go && \
   grep -q 'forge-agent-sdk' server/pkg/agent/hermes.go"

check "7.8 web layout has no multica.ai metadataBase" \
  "! grep -q 'multica.ai' apps/web/app/layout.tsx"

check "7.9 web layout has no multica_hq twitter handle" \
  "! grep -q 'multica_hq' apps/web/app/layout.tsx"

echo ""

# ── 8. Slack Integration ──────────────────────────────────────────────────────
echo "[ 8 ] Slack Integration"

check "8.1 Slack migration 089 exists" \
  "ls server/migrations/089_workspace_slack_integrations.up.sql > /dev/null 2>&1"

check "8.2 Slack migration 090 FK fix exists (created_by → user not member)" \
  "ls server/migrations/090_slack_created_by_fk_fix.up.sql > /dev/null 2>&1"

check "8.3 Slack integration package exists" \
  "test -f server/internal/integrations/slack/notify.go"

check "8.4 Slack SSRF guard uses parsed URL validation not raw string prefix" \
  "grep -q 'ValidateWebhookURL' server/internal/integrations/slack/client.go && \
   grep -q 'url.Parse' server/internal/integrations/slack/client.go"

check "8.5 Slack DeleteSlackIntegration is soft-delete (DisableSlackIntegration)" \
  "grep -q 'DisableSlackIntegration' server/internal/handler/slack_integration.go"

check "8.6 Slack hook wired in notification_listeners (NotifyStatusChange)" \
  "grep -q 'slack.NotifyStatusChange' server/cmd/server/notification_listeners.go"

check "8.7 Slack routes have admin RBAC gate" \
  "grep -q 'integrations/slack' server/cmd/server/router.go && \
   grep -q 'RequireWorkspaceRole' server/cmd/server/router.go"

check "8.8 Slack TestSlackIntegration uses detached context for DB writes" \
  "grep -q 'context.Background.*3.*Second\|statusCtx' server/internal/handler/slack_integration.go"

check "8.9 Slack useTestSlackIntegration invalidates query on success" \
  "grep -q 'onSuccess' packages/core/slack-integration/mutations.ts"

check "8.10 Slack history returned in GET response (soft-delete audit trail)" \
  "grep -q 'ListSlackIntegrationHistoryForWorkspace\|history' server/internal/handler/slack_integration.go"

echo ""

# ── 9. Agent Templates ────────────────────────────────────────────────────────
echo "[ 9 ] Agent Templates"

check "9.1 Template registry has at least 26 templates" \
  "ls server/internal/agenttmpl/templates/*.json | wc -l | xargs -I{} test {} -ge 26"

check "9.2 Finance Analyst template exists" \
  "test -f server/internal/agenttmpl/templates/finance-analyst.json"

check "9.3 Business Analyst template exists" \
  "test -f server/internal/agenttmpl/templates/business-analyst.json"

check "9.4 Project Manager template exists" \
  "test -f server/internal/agenttmpl/templates/project-manager.json"

check "9.5 Asymbl Content Marketer template exists" \
  "test -f server/internal/agenttmpl/templates/asymbl-content-marketer.json"

check "9.6 Asymbl Delivery BA template exists" \
  "test -f server/internal/agenttmpl/templates/asymbl-delivery-ba.json"

check "9.7 Asymbl Payroll COGS Split template exists" \
  "test -f server/internal/agenttmpl/templates/asymbl-payroll-cogs-split.json"

check "9.8 Asymbl India GST template exists" \
  "test -f server/internal/agenttmpl/templates/asymbl-india-gst.json"

check "9.9 Asymbl India FY Close template exists" \
  "test -f server/internal/agenttmpl/templates/asymbl-india-fy-close.json"

check "9.10 All templates pass agenttmpl loader validation (go test)" \
  "(cd server && go test ./internal/agenttmpl/... -count=1 -timeout 30s)"

echo ""

# ── 10. Test Infrastructure ───────────────────────────────────────────────────
echo "[ 10 ] Test Infrastructure"

check "10.1 Middleware Redis tests use isolated DB 14 (not shared DB 1)" \
  "grep -q 'middlewareTestRedisDB = 14' server/internal/middleware/auth_test.go"

check "10.2 Flaky auth cache test uses dedicated DB constant" \
  "grep -q 'opts.DB = middlewareTestRedisDB' server/internal/middleware/auth_test.go"

echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
echo "=== Results: $PASS passed, $FAIL failed ==="
echo ""

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "Failed checks:"
  for f in "${FAILURES[@]}"; do
    echo "  $f"
  done
  echo ""
  echo "See docs/fork-patches.md for how to restore each patch."
  exit 1
fi

echo "All Forge patches intact."
exit 0
