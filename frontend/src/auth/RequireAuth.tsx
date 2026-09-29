import { Navigate, Outlet, useLocation } from "react-router-dom";

import { Spinner } from "../components/ui/Spinner";
import { useAuth } from "./authContext";

export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Spinner label="Loading your account" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
