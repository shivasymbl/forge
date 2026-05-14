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
import { githubInstallationsOptions } from "@multica/core/github/queries";
import { slackIntegrationOptions } from "@multica/core/slack-integration";
import {
  useUpdateSlackIntegration,
  useDeleteSlackIntegration,
  useTestSlackIntegration,
} from "@multica/core/slack-integration";
import { ALL_STATUSES, STATUS_CONFIG } from "@multica/core/issues/config";
import { api } from "@multica/core/api";
import { useT } from "../../i18n";

// lucide-react v1.x dropped brand marks. Inline SVG of the official GitHub mark.
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 .5C5.6.5.5 5.6.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2.2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.3 1.9-.4 2.9-.4s2 .1 2.9.4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.6 18.4.5 12 .5z" />
    </svg>
  );
}

// Inline Slack "hashtag" bolt mark — avoids any external icon dependency.
function SlackMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

export function IntegrationsTab() {
  const { t } = useT("settings");
  const wsId = useWorkspaceId();
  const user = useAuthStore((s) => s.user);
  const { data: members = [] } = useQuery(memberListOptions(wsId));
  const [connecting, setConnecting] = useState(false);

  const currentMember = members.find((m) => m.user_id === user?.id) ?? null;
  const canManage = currentMember?.role === "owner" || currentMember?.role === "admin";

  const { data } = useQuery({
    ...githubInstallationsOptions(wsId),
    enabled: !!wsId && canManage,
  });
  const configured = data?.configured ?? false;

  async function handleConnect() {
    setConnecting(true);
    try {
      const resp = await api.getGitHubConnectURL(wsId);
      if (!resp.configured || !resp.url) {
        toast.error(t(($) => $.integrations.toast_not_configured));
        return;
      }
      window.open(resp.url, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t(($) => $.integrations.toast_open_failed));
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">{t(($) => $.integrations.section_title)}</h2>

        {/* GitHub */}
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <GitHubMark className="h-6 w-6 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t(($) => $.integrations.github_title)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(($) => $.integrations.github_description_prefix)}{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                      {t(($) => $.integrations.github_identifier_example)}
                    </code>{" "}
                    {t(($) => $.integrations.github_description_suffix)}{" "}
                    <strong>{t(($) => $.integrations.github_description_done)}</strong>.
                  </p>
                </div>
              </div>
              {canManage && (
                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={connecting || !configured}
                  title={!configured ? t(($) => $.integrations.connect_disabled_tooltip) : undefined}
                >
                  {connecting
                    ? t(($) => $.integrations.connect_opening)
                    : t(($) => $.integrations.connect_github)}
                </Button>
              )}
            </div>

            {canManage && !configured && (
              <p className="text-xs text-muted-foreground">
                {t(($) => $.integrations.not_configured)}{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[10px]">GITHUB_APP_SLUG</code>{" "}
                {t(($) => $.integrations.not_configured_and)}{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[10px]">GITHUB_WEBHOOK_SECRET</code>.
              </p>
            )}

            {!canManage && (
              <p className="text-xs text-muted-foreground">
                {t(($) => $.integrations.manage_hint)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Slack */}
        <SlackCard canManage={canManage} wsId={wsId} />
      </section>
    </div>
  );
}

function SlackCard({ canManage, wsId }: { canManage: boolean; wsId: string }) {
  const { t } = useT("settings");

  const { data: slackData, isLoading } = useQuery({
    ...slackIntegrationOptions(wsId),
    enabled: !!wsId && canManage,
  });

  const existingIntegration = slackData?.configured ? slackData.integration : undefined;

  const [webhookURL, setWebhookURL] = useState("");
  const [triggerStatuses, setTriggerStatuses] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  // Hydrate trigger statuses from server when data arrives and user hasn't edited.
  // webhookURL is intentionally left blank — the masked value isn't useful in the input.
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
        enabled: true,
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

  async function handleDelete() {
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
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t(($) => $.integrations.slack_webhook_label)}
              </label>
              {slackData?.configured && !dirty && (
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {existingIntegration?.webhook_url_mask}
                </p>
              )}
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
                {t(($) => $.integrations.slack_save_button)}
              </Button>
              {slackData?.configured && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  {t(($) => $.integrations.slack_delete_button)}
                </Button>
              )}
            </div>
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
