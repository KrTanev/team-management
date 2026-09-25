import { Navigate, type RouteObject } from "react-router-dom";

import { RequireAuth } from "../auth/RequireAuth";
import { Layout } from "../components/layout/Layout";
import ErrorPage from "./ErrorPage";
import { LoginPage } from "./LoginPage";
import { NotBuiltPage } from "./NotBuiltPage";
import { TeamDetailPage } from "./TeamDetailPage";
import { TeamsPage } from "./TeamsPage";
import { UsersPage } from "./UsersPage";

export const routes: RouteObject[] = [
  { path: "/login", element: <LoginPage />, errorElement: <ErrorPage /> },
  {
    element: <RequireAuth />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/teams" replace /> },
          { path: "teams", element: <TeamsPage /> },
          { path: "teams/:teamId", element: <TeamDetailPage /> },
          { path: "users", element: <UsersPage /> },
          { path: "projects", element: <NotBuiltPage title="Projects" task="fe-component" /> },
          { path: "activity", element: <NotBuiltPage title="Activity log" task="fe-virtualization" /> },
          { path: "dashboard", element: <NotBuiltPage title="Dashboard" task="fe-code-split" /> },
        ],
      },
    ],
  },
];
