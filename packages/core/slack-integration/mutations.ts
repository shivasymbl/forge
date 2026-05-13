import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { useWorkspaceId } from "../hooks";
import { slackIntegrationKeys } from "./queries";
import type { PutSlackIntegrationBody } from "../types";

export function useUpdateSlackIntegration() {
  const qc = useQueryClient();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: (body: PutSlackIntegrationBody) => api.putSlackIntegration(wsId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: slackIntegrationKeys.all(wsId) });
    },
  });
}

export function useDeleteSlackIntegration() {
  const qc = useQueryClient();
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: () => api.deleteSlackIntegration(wsId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: slackIntegrationKeys.all(wsId) });
    },
  });
}

export function useTestSlackIntegration() {
  const wsId = useWorkspaceId();

  return useMutation({
    mutationFn: () => api.testSlackIntegration(wsId),
  });
}
