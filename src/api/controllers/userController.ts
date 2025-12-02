import { axiosClient } from "../../config/axios.config";
import type { User } from "../types/userTypes";
import { useQuery } from "@tanstack/react-query";

export const userKeys = {
  allUsers: "allUsers",
  userDetails: (userId: number) => [userKeys.allUsers, `userDetails-${userId}`],
};

export const useGetAllUser = () => {
  return useQuery<User[]>({
    queryKey: [userKeys.allUsers],
    queryFn: async () => {
      const { data } = await axiosClient.get('/users')

      return data;
    },
  });
};
