import { AppBar, Button, Toolbar, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/hooks/useAuth";

type TopbarProps = {
  title?: string;
};

export const Topbar = ({ title = "Team Management" }: TopbarProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayName = user?.displayName ?? "";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        <Typography sx={{ flexGrow: 1 }} variant="h6" noWrap component="div">
          {title}
        </Typography>
        <Typography
          variant="body1"
          sx={{ mr: 2 }}
        >{`Welcome, ${displayName}`}</Typography>
        <Button color="inherit" onClick={handleLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
