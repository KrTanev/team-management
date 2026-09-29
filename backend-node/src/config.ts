// Settings are read straight from the environment with fallbacks.
export const DATABASE_URL = process.env.DATABASE_URL ?? "team-management.db";
export const PORT = Number(process.env.PORT ?? 8000);
export const TEST_MODE = process.env.BD_TEST_MODE === "1";
export const DEBUG_QUERIES = process.env.BD_DEBUG_QUERIES === "1" || TEST_MODE;
export const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(",");
export const TOKEN_BYTES = 32;
