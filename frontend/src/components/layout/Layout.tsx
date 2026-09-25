import { Outlet } from "react-router-dom";

import ContentWrapper from "./ContentWrapper";
import ErrorBoundary from "./ErrorBoundary";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export const Layout = () => (
  <>
    <Topbar />
    <Sidebar />
    <ContentWrapper>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </ContentWrapper>
  </>
);

export default Layout;
