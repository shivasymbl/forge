-- Fix: created_by should reference "user"(id) not member(id).
-- The handler passes the authenticated user's UUID (from JWT), not the member row UUID.
-- All other audit columns in this schema (github_installation.connected_by_id,
-- skill.created_by) also reference "user"(id).
ALTER TABLE workspace_slack_integrations
    DROP CONSTRAINT IF EXISTS workspace_slack_integrations_created_by_fkey,
    ADD CONSTRAINT workspace_slack_integrations_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE SET NULL;
