ALTER TABLE workspace_slack_integrations
    DROP CONSTRAINT IF EXISTS workspace_slack_integrations_created_by_fkey,
    ADD CONSTRAINT workspace_slack_integrations_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES member(id) ON DELETE SET NULL;
