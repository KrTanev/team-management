import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { axiosClient } from "../config/axios.config";
import type { Page, Team, TeamRole } from "./types";

export const teamKeys = {
  all: ["teams"] as const,
  list: () => [...teamKeys.all, "list"] as const,
  detail: (id: number) => [...teamKeys.all, "detail", id] as const,
};

export const useTeams = () =>
  useQuery({
    queryKey: teamKeys.list(),
    queryFn: async () =>
      (await axiosClient.get<Page<Team>>("/teams", { params: { limit: 100 } })).data,
  });

export const useTeam = (teamId: number) =>
  useQuery({
    queryKey: teamKeys.detail(teamId),
    queryFn: async () => (await axiosClient.get<Team>(`/teams/${teamId}`)).data,
  });

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; description?: string }) =>
      (await axiosClient.post<Team>("/teams", body)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.all }),
  });
};

export const useAddTeamMember = (teamId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { userId: number; role: TeamRole }) =>
      (await axiosClient.post<Team>(`/teams/${teamId}/members`, body)).data,
    onSuccess: (team) => {
      queryClient.setQueryData(teamKeys.detail(teamId), team);
      queryClient.invalidateQueries({ queryKey: teamKeys.list() });
    },
  });
};

export const useRemoveTeamMember = (teamId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      await axiosClient.delete(`/teams/${teamId}/members/${userId}`);
    },
    // Optimistic: drop the member from the cached team right away.
    onMutate: (userId) => {
      queryClient.setQueryData<Team>(teamKeys.detail(teamId), (team) =>
        team ? { ...team, members: team.members.filter((m) => m.userId !== userId) } : team,
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.list() }),
  });
};
