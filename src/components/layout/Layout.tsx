import { Box, CssBaseline } from "@mui/material";
import ErrorBoundary from "./ErrorBoundary";
import { Outlet } from "react-router-dom";
import ContentWrapper from "./ContentWrapper";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const drawerWidth = 240;

export const Layout = () => {
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Topbar />
      <Sidebar />
      <ContentWrapper drawerWidth={drawerWidth}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </ContentWrapper>
    </Box>
  );
};

export default Layout;
