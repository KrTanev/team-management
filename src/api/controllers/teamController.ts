import { axiosClient } from "../../config/axios.config";
import type { Team, CreateTeamDto, UpdateTeamDto } from "../types/teamTypes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const teamKeys = {
  allTeams: "allTeams",
  teamDetails: (teamId: number) => [teamKeys.allTeams, `teamDetails-${teamId}`],
};

export const useGetAllTeams = () => {
  return useQuery<Team[]>({
    queryKey: [teamKeys.allTeams],
    queryFn: async () => {
      const { data } = await axiosClient.get<Team[]>("/teams");
      return data;
    },
  });
};

export const useGetTeamById = (teamId: number) => {
  return useQuery<Team>({
    queryKey: teamKeys.teamDetails(teamId),
    queryFn: async () => {
      const { data } = await axiosClient.get<Team>(`/teams/${teamId}`);
      return data;
    },
    enabled: !!teamId,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation<Team, Error, CreateTeamDto>({
    mutationFn: async (newTeam: CreateTeamDto) => {
      const { data } = await axiosClient.post<Team>("/teams", newTeam);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [teamKeys.allTeams] });
    },
  });
};


export const useUpdateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation<Team, Error, { id: number; updates: UpdateTeamDto }>({
    mutationFn: async ({ id, updates }) => {
      const { data } = await axiosClient.patch<Team>(`/teams/${id}`, updates);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [teamKeys.allTeams] });
      queryClient.invalidateQueries({ queryKey: teamKeys.teamDetails(data.id) });
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (teamId: number) => {
      await axiosClient.delete(`/teams/${teamId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [teamKeys.allTeams] });
    },
  });
};
