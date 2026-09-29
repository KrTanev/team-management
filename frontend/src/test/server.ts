/**
 * Component tests run against the same in-memory mock API as `npm run dev:mock`
 * (src/mocks/fakeApi.ts). It's reset before every test in setup.ts; use `fake`
 * to change data, add latency or make endpoints fail.
 */
import { setupServer } from "msw/node";

import { createHandlers, fake } from "../mocks/fakeApi";

export const API = "http://api.test";
export { fake };

export const server = setupServer(...createHandlers(API));
