import axios from "axios";
import { envConfig } from "./env.config";

export const axiosClient = axios.create({
  baseURL: envConfig.apiUrl,
  timeout: 1000 * 20,
});
