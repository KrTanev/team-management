import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { AuthProvider } from "./auth/AuthProvider";
import { queryClient as defaultQueryClient } from "./config/queryClient.config";

type Props = { children: ReactNode; queryClient?: QueryClient };

/**
 * Every app-wide provider except the router. The app and BetterDev's hidden
 * checks both render through this — add new providers here, keep the export.
 */
export function AppProviders({ children, queryClient = defaultQueryClient }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
