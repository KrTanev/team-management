import { axiosClient } from "../../config/axios.config";
import type { User } from "../types/userTypes";
import { useQuery } from "@tanstack/react-query";

export const userKeys = {
  allUsers: "allUsers",
  userDetails: (userId: number) => [userKeys.allUsers, `userDetails-${userId}`],
};

export const useGetAllUsers = () => {
  return useQuery<User[]>({
    queryKey: [userKeys.allUsers],
    queryFn: async () => {
      const { data } = await axiosClient.get('/users')

      return data;
    },
  });
};

export const useGetUser = (userId: number | undefined) =>{
  return useQuery<User>({
    queryKey: userId ? userKeys.userDetails(userId) : [userKeys.allUsers, "userDetails-undefined"],
    queryFn: async () => {
      const {data } = await axiosClient.get(`/users${userId}`);
      return data;
    }
  })
}
