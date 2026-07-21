"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@multica/ui/components/ui/button";
import { Card, CardContent } from "@multica/ui/components/ui/card";
import { Input } from "@multica/ui/components/ui/input";
import { Checkbox } from "@multica/ui/components/ui/checkbox";
import { useAuthStore } from "@multica/core/auth";
import { useWorkspaceId } from "@multica/core/hooks";
import { memberListOptions } from "@multica/core/workspace/queries";
import { slackIntegrationOptions } from "@multica/core/slack-integration";
import {
  useUpdateSlackIntegration,
  useDeleteSlackIntegration,
  useTestSlackIntegration,
} from "@multica/core/slack-integration";
import { ALL_STATUSES, STATUS_CONFIG } from "@multica/core/issues/config";
import { LarkTab } from "./lark-tab";
import { ComposioTab } from "./composio-tab";
import { SlackTab } from "./slack-tab";
import { ApiError } from "@multica/core/api";
import { composioToolkitsOptions } from "@multica/core/composio";
import { useFeatureEnabled } from "@multica/core/config";
import { COMPOSIO_MCP_APPS_FLAG } from "@multica/core/feature-flags";
import { useT } from "../../i18n";
import { SettingsSection, SettingsTab } from "./settings-layout";

// Inline Slack "hashtag" bolt mark — avoids any external icon dependency.
function SlackMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

// Integrations is the umbrella tab for third-party platform connections.
// GitHub has its own top-level tab (see github-tab.tsx); everything else
// — currently Lark, Composio, Slack (native app install), and our own
// Slack webhook integration (Forge fork patch), with Linear etc. to follow
// — lives in here under its own section heading so additional integrations
// slot in without changing the IA. IntegrationsTab is just the host; each
// integration owns its own description and install flow.
export function IntegrationsTab() {
  const { t } = useT("settings");
  const wsId = useWorkspaceId();
  const user = useAuthStore((s) => s.user);
  const { data: members = [] } = useQuery(memberListOptions(wsId));

  const currentMember = members.find((m) => m.user_id === user?.id) ?? null;
  const canManage = currentMember?.role === "owner" || currentMember?.role === "admin";

  const composioEnabled = useFeatureEnabled(COMPOSIO_MCP_APPS_FLAG, false);
  // Composio is hidden entirely until the feature is enabled and a key is
  // configured server-side. A 503 from the toolkits endpoint means the server
  // withheld the integration despite the frontend flag being on.
  const composioToolkits = useQuery({
    ...composioToolkitsOptions(),
    enabled: composioEnabled,
  });
  const composioUnconfigured =
    composioToolkits.error instanceof ApiError && composioToolkits.error.status === 503;

  return (
    <SettingsTab title={t(($) => $.page.tabs.integrations)}>
      <SettingsSection title={t(($) => $.lark.section_title)}>
        <LarkTab />
      </SettingsSection>
      {composioEnabled && !composioUnconfigured && (
        <SettingsSection title={t(($) => $.composio.section_title)}>
          <ComposioTab />
        </SettingsSection>
      )}
      <SettingsSection title={t(($) => $.slack.section_title)}>
        <SlackTab />
      </SettingsSection>
      <SettingsSection>
        <SlackCard canManage={canManage} wsId={wsId} />
      </SettingsSection>
    </SettingsTab>
  );
}

function SlackCard({ canManage, wsId }: { canManage: boolean; wsId: string }) {
  const { t } = useT("settings");

  const { data: slackData, isLoading } = useQuery({
    ...slackIntegrationOptions(wsId),
    enabled: !!wsId && canManage,
  });

  const existingIntegration = slackData?.configured ? slackData.integration : undefined;
  const history = slackData?.history ?? [];

  const [webhookURL, setWebhookURL] = useState("");
  const [triggerStatuses, setTriggerStatuses] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  // Hydrate trigger statuses from server when data arrives and user hasn't edited.
  // webhookURL is left blank — the masked value isn't useful in an input field.
  useEffect(() => {
    if (!existingIntegration || dirty) return;
    setTriggerStatuses(existingIntegration.trigger_statuses ?? []);
  }, [existingIntegration, dirty]);

  const updateMutation = useUpdateSlackIntegration();
  const deleteMutation = useDeleteSlackIntegration();
  const testMutation = useTestSlackIntegration();

  function toggleStatus(status: string) {
    setDirty(true);
    setTriggerStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }

  async function handleSave() {
    try {
      await updateMutation.mutateAsync({
        webhook_url: webhookURL,
        trigger_statuses: triggerStatuses,
      });
      setWebhookURL("");
      setDirty(false);
      toast.success(t(($) => $.integrations.slack_toast_saved));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  }

  async function handleTest() {
    try {
      const result = await testMutation.mutateAsync();
      if (result.ok) {
        toast.success(t(($) => $.integrations.slack_toast_test_success));
      } else {
        toast.error(result.error ?? t(($) => $.integrations.slack_toast_test_failed));
      }
    } catch {
      toast.error(t(($) => $.integrations.slack_toast_test_failed));
    }
  }

  async function handleDisconnect() {
    try {
      await deleteMutation.mutateAsync();
      setWebhookURL("");
      setTriggerStatuses([]);
      setDirty(false);
      toast.success(t(($) => $.integrations.slack_toast_deleted));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to disconnect");
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <SlackMark className="h-6 w-6 mt-0.5 shrink-0 text-[#4A154B]" />
            <div className="space-y-1">
              <p className="text-sm font-medium">{t(($) => $.integrations.slack_title)}</p>
              <p className="text-xs text-muted-foreground">
                {t(($) => $.integrations.slack_description)}
              </p>
            </div>
          </div>
          {canManage && slackData?.configured && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleTest}
              disabled={testMutation.isPending || isLoading}
            >
              {t(($) => $.integrations.slack_test_button)}
            </Button>
          )}
        </div>

        {canManage && (
          <div className="space-y-4">
            {/* Active integration status */}
            {slackData?.configured && existingIntegration && (
              <div className="rounded-md bg-muted/50 px-3 py-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t(($) => $.integrations.slack_active_label)}</p>
                <p className="text-xs font-mono text-foreground truncate">
                  {existingIntegration.webhook_url_mask}
                </p>
                {existingIntegration.last_sent_at && (
                  <p className="text-xs text-muted-foreground">
                    {t(($) => $.integrations.slack_last_sent)}: {new Date(existingIntegration.last_sent_at).toLocaleString()}
                  </p>
                )}
                {existingIntegration.last_error && (
                  <p className="text-xs text-destructive">
                    {t(($) => $.integrations.slack_last_error_label)}: {existingIntegration.last_error}
                  </p>
                )}
              </div>
            )}

            {/* Webhook URL input — always visible to allow reconfiguring */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {slackData?.configured
                  ? t(($) => $.integrations.slack_webhook_label_update)
                  : t(($) => $.integrations.slack_webhook_label)}
              </label>
              <Input
                type="text"
                value={webhookURL}
                onChange={(e) => {
                  setWebhookURL(e.target.value);
                  setDirty(true);
                }}
                placeholder={t(($) => $.integrations.slack_webhook_placeholder)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t(($) => $.integrations.slack_triggers_label)}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {ALL_STATUSES.map((status) => (
                  <label key={status} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={triggerStatuses.includes(status)}
                      onCheckedChange={() => toggleStatus(status)}
                    />
                    <span className="text-xs">{STATUS_CONFIG[status].label}</span>
                  </label>
                ))}
              </div>
              {triggerStatuses.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t(($) => $.integrations.slack_triggers_any)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!webhookURL || updateMutation.isPending}
              >
                {slackData?.configured
                  ? t(($) => $.integrations.slack_update_button)
                  : t(($) => $.integrations.slack_save_button)}
              </Button>
              {slackData?.configured && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDisconnect}
                  disabled={deleteMutation.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  {t(($) => $.integrations.slack_delete_button)}
                </Button>
              )}
            </div>

            {/* History — previous webhook configurations preserved on disconnect */}
            {history.length > 0 && (
              <div className="space-y-1.5 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {t(($) => $.integrations.slack_history_label)}
                </p>
                <div className="space-y-1.5">
                  {history.map((entry, i) => (
                    <div key={i} className="rounded-md bg-muted/30 px-3 py-2 space-y-0.5">
                      <p className="text-xs font-mono text-muted-foreground truncate">
                        {entry.webhook_url_mask}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">
                        {t(($) => $.integrations.slack_history_disconnected)}{" "}
                        {new Date(entry.disabled_at).toLocaleString()}
                        {entry.last_sent_at && (
                          <>{" · "}{t(($) => $.integrations.slack_last_sent)}{" "}{new Date(entry.last_sent_at).toLocaleString()}</>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!canManage && (
          <p className="text-xs text-muted-foreground">
            {t(($) => $.integrations.manage_hint)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
