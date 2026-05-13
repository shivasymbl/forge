import { queryOptions } from "@tanstack/react-query";
import { api } from "../api";

export const slackIntegrationKeys = {
  all: (wsId: string) => ["slack-integration", wsId] as const,
};

export function slackIntegrationOptions(wsId: string) {
  return queryOptions({
    queryKey: slackIntegrationKeys.all(wsId),
    queryFn: () => api.getSlackIntegration(wsId),
  });
}
