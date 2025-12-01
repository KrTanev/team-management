import { Box, Toolbar } from "@mui/material";

type ContentWrapperProps = {
  children?: React.ReactNode;
  drawerWidth?: number;
};

export const ContentWrapper = ({
  children,
  drawerWidth = 240,
}: ContentWrapperProps) => {
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        width: `calc(100% - ${drawerWidth}px)`,
      }}
    >
      <Toolbar />
      {children}
    </Box>
  );
};

export default ContentWrapper;
