import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import { fake, server } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => fake.reset());
afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());
