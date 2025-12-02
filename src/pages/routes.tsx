import type { RouteObject } from "react-router-dom";
import { LandingPage } from "./LandingPage";
import { Layout } from "../components/layout/Layout";
import ErrorPage from "./ErrorPage";
import { TeamsPage } from "./TeamsPage";
import { RegisterPage } from "./RegisterPage";
import { LoginPage } from "./LoginPage";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      
      {
        path: "/teams",
        element: <TeamsPage />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage/>,
    children: [
      {
        path: "register",
        element: <RegisterPage/>
      },
    ],
  },
];
