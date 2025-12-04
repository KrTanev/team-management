import { axiosClient } from "../../config/axios.config";
import { queryClient } from "../../config/queryClient.config";
import type { User } from "../types/userTypes";
import { useMutation, useQuery } from "@tanstack/react-query";

export const userKeys = {
  allUsers: ["allUsers"],
  userDetails: (userId?: number) => [
    userKeys.allUsers,
    `userDetails-${userId}`,
  ],
};

export const useGetAllUsers = () => {
  return useQuery<User[]>({
    queryKey: userKeys.allUsers,
    queryFn: async () => {
      const { data } = await axiosClient.get("/users");

      return data;
    },
  });
};

export const useGetUser = (userId: number | undefined) => {
  return useQuery<User[]>({
    queryKey: userKeys.userDetails(userId),
    queryFn: async () => {
      const { data } = await axiosClient.get(`/users?id=${userId}`);
      return data;
    },
  });
};

export const useCreateUser = () => {
  return useMutation({
    mutationFn: async (user: Partial<User>) => {
      const response = await axiosClient.post("/users", user);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.allUsers });
    },
  });
};
