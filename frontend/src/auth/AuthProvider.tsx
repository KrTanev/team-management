import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useMemo, useState } from "react";

import { fetchMe, login, logout } from "../api/auth";
import { AuthContext, type AuthState } from "./authContext";
import { tokenStorage } from "./tokenStorage";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(() => tokenStorage.get());

  const me = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: fetchMe,
    enabled: token !== null,
  });

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { token: newToken, user } = await login(email, password);
      tokenStorage.set(newToken);
      queryClient.setQueryData(["auth", "me", newToken], user);
      setToken(newToken);
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    await logout().catch(() => undefined);
    tokenStorage.clear();
    queryClient.clear();
    setToken(null);
  }, [queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      user: token ? (me.data ?? null) : null,
      isLoading: token !== null && me.isPending,
      signIn,
      signOut,
    }),
    [token, me.data, me.isPending, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
