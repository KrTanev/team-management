import { axiosClient } from "../config/axios.config";
import type { User } from "./userTypes";
import { useQuery } from "@tanstack/react-query";

export const userKeys = {
  allUsers: "allUsers",
  userDetails: (userId: number) => [userKeys.allUsers, `userDetails-${userId}`],
};

export const useGetUserAlbum = (userId: number) => {
  return useQuery<User[]>({
    queryKey: [userKeys.allUsers],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/albums?userId=${userId}`);

      return data;
    },
  });
};
