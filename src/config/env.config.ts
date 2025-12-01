import { getEnv } from "../utils/helpers/env";

export const envConfig = {
  apiUrl: getEnv("VITE_API_URL", { required: true, type: "string" }),
} as const;
