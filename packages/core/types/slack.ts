export interface SlackIntegration {
  workspace_id: string;
  webhook_url_mask: string;
  label: string;
  trigger_statuses: string[];
  last_sent_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface SlackIntegrationHistoryEntry {
  webhook_url_mask: string;
  label: string;
  trigger_statuses: string[];
  last_sent_at: string | null;
  disabled_at: string;
}

export interface SlackIntegrationResponse {
  configured: boolean;
  integration?: SlackIntegration;
  history: SlackIntegrationHistoryEntry[];
}

export interface PutSlackIntegrationBody {
  webhook_url: string;
  label?: string;
  trigger_statuses?: string[];
}

export interface TestSlackIntegrationResponse {
  ok: boolean;
  error?: string;
}
