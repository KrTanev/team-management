import { setupWorker } from "msw/browser";

import { envConfig } from "../config/env.config";
import { createHandlers, fake } from "./fakeApi";

/** Starts the in-browser mock API (`npm run dev:mock`). Resolves once requests are intercepted. */
export async function startMockApi() {
  fake.loadDefaultActivity();
  const worker = setupWorker(...createHandlers(envConfig.apiUrl));
  await worker.start({ onUnhandledRequest: "bypass", quiet: true });
  console.info(
    `[mock API] Answering ${envConfig.apiUrl} from src/mocks/fakeApi.ts — data resets on reload.`,
  );
}
