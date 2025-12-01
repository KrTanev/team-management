import { Box, Button, Typography } from "@mui/material";
import { useNavigate, useRouteError } from "react-router-dom";

export const ErrorPage = () => {
  const error = useRouteError() as Error;
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Oops — an error occurred
      </Typography>

      <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
        {String(error?.message ?? error ?? "Unknown error")}
      </Typography>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button variant="outlined" onClick={() => navigate("/")}>
          Home
        </Button>
      </Box>
    </Box>
  );
};

export default ErrorPage;
