import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: { DATABASE_URL: ":memory:", BD_TEST_MODE: "1" },
  },
});
