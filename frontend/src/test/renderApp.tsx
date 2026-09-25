import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import { AppProviders } from "../AppProviders";
import { tokenStorage } from "../auth/tokenStorage";
import { routes } from "../pages/routes";

/** Renders the whole app at `path`, optionally signed in as a seeded user id. */
export function renderApp(path: string, { userId }: { userId?: number } = {}) {
  if (userId) tokenStorage.set(`token-${userId}`);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const utils = render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...utils, router, queryClient };
}
