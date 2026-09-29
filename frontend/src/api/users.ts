import { useQuery } from "@tanstack/react-query";

import { axiosClient } from "../config/axios.config";
import type { Page, User } from "./types";

export const userKeys = {
  all: ["users"] as const,
  list: (params: UsersQuery) => [...userKeys.all, "list", params] as const,
  detail: (id: number) => [...userKeys.all, "detail", id] as const,
};

export type UsersQuery = { search?: string; limit?: number; offset?: number };

export async function fetchUsers(params: UsersQuery) {
  const { data } = await axiosClient.get<Page<User>>("/users", { params });
  return data;
}

/** Every user, for pickers. The seed is small; see the fe-virtualization task for scale. */
export const useAllUsers = () =>
  useQuery({
    queryKey: userKeys.list({ limit: 100 }),
    queryFn: () => fetchUsers({ limit: 100 }),
    select: (page) => page.items,
  });
