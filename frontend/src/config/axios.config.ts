import axios from "axios";

import { tokenStorage } from "../auth/tokenStorage";
import { envConfig } from "./env.config";

export const axiosClient = axios.create({
  baseURL: envConfig.apiUrl,
  timeout: 1000 * 20,
});

axiosClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
