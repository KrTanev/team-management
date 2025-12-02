import { AppBar, Button, Toolbar, Typography } from "@mui/material";

type TopbarProps = {
  title?: string;
};

export const Topbar = ({ title = "Team Management" }: TopbarProps) => {
  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        <Typography sx= {{flexGrow: 1}} variant="h6" noWrap component="div">
          {title}
        </Typography>
        <Button color="inherit">Login</Button>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
