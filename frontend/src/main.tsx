import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";

async function start() {
  // `npm run dev:mock`: answer API calls in the browser, no backend needed.
  if (import.meta.env.VITE_USE_MOCK_API === "true") {
    const { startMockApi } = await import("./mocks/browser");
    await startMockApi();
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();
