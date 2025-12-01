import { axiosClient } from "../config/axios.config";
import type { User } from "./userTypes";
import { useQuery } from "@tanstack/react-query";

export const userKeys = {
  allUsers: "allUsers",
  userDetails: (userId: number) => [userKeys.allUsers, `userDetails-${userId}`],
};

export const useGetAllUsers = () => {
  return useQuery<User[]>({
    queryKey: [userKeys.allUsers],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/users`);

      return data;
    },
  });
};
