export interface SlackIntegration {
  workspace_id: string;
  enabled: boolean;
  webhook_url_mask: string;
  label: string;
  trigger_statuses: string[];
  last_sent_at: string | null;
  last_error: string | null;
}

export interface SlackIntegrationResponse {
  configured: boolean;
  integration?: SlackIntegration;
}

export interface PutSlackIntegrationBody {
  webhook_url: string;
  label?: string;
  trigger_statuses?: string[];
  enabled?: boolean;
}

export interface TestSlackIntegrationResponse {
  ok: boolean;
  error?: string;
}
