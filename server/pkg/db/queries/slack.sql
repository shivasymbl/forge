-- name: GetSlackIntegrationForWorkspace :one
SELECT * FROM workspace_slack_integrations
WHERE workspace_id = $1 AND enabled = true
LIMIT 1;

-- name: ListSlackIntegrationHistoryForWorkspace :many
SELECT * FROM workspace_slack_integrations
WHERE workspace_id = $1 AND enabled = false
ORDER BY updated_at DESC
LIMIT 5;

-- name: UpsertSlackIntegration :one
INSERT INTO workspace_slack_integrations (
    workspace_id, enabled, webhook_url, label, trigger_statuses, created_by
) VALUES (
    $1, true, $2, $3, $4, $5
)
ON CONFLICT (workspace_id) WHERE enabled = true
DO UPDATE SET
    webhook_url      = EXCLUDED.webhook_url,
    label            = EXCLUDED.label,
    trigger_statuses = EXCLUDED.trigger_statuses,
    updated_at       = now()
RETURNING *;

-- name: DisableSlackIntegration :exec
UPDATE workspace_slack_integrations
SET enabled    = false,
    updated_at = now()
WHERE workspace_id = $1 AND enabled = true;

-- name: DeleteSlackIntegration :exec
DELETE FROM workspace_slack_integrations
WHERE workspace_id = $1;

-- name: UpdateSlackIntegrationStatus :exec
UPDATE workspace_slack_integrations
SET
    last_sent_at = sqlc.narg('last_sent_at'),
    last_error   = sqlc.narg('last_error'),
    updated_at   = now()
WHERE workspace_id = $1 AND enabled = true;
