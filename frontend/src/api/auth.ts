import { axiosClient } from "../config/axios.config";
import type { User } from "./types";

export async function login(email: string, password: string) {
  const { data } = await axiosClient.post<{ token: string; user: User }>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function fetchMe() {
  const { data } = await axiosClient.get<User>("/auth/me");
  return data;
}

export async function logout() {
  await axiosClient.post("/auth/logout");
}
