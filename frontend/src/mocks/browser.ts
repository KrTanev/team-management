import { setupWorker } from "msw/browser";

import { envConfig } from "../config/env.config";
import { createHandlers, fake } from "./fakeApi";
import { installFakeWebSocket } from "./fakeRealtime";

/** Starts the in-browser mock API (`npm run dev:mock`). Resolves once requests are intercepted. */
export async function startMockApi() {
  fake.loadDefaultActivity();
  const worker = setupWorker(...createHandlers(envConfig.apiUrl));
  await worker.start({ onUnhandledRequest: "bypass", quiet: true });
  installFakeWebSocket(envConfig.apiUrl);
  console.info(
    `[mock API] Answering ${envConfig.apiUrl} from src/mocks/fakeApi.ts (+ the chat WebSocket from fakeRealtime.ts) — data resets on reload.`,
  );
}
