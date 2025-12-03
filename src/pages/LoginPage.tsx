import {
  Avatar,
  Box,
  Button,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/hooks/useAuth";
import { useGetAllUsers } from "../api/controllers/userController";
import { useRedirectIfLogged } from "../utils/hooks/useRedirectIfLogged";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchUsers = useGetAllUsers();
  const { data } = fetchUsers;

  const { login } = useAuth();
  const navigate = useNavigate();

  useRedirectIfLogged();

  const handleLogin = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedSecret = secret.trim();

    if (!trimmedEmail || !trimmedSecret) {
      return;
    }

    setLoginError("");
    setIsSubmitting(true);

    try {
      const existingUser = data?.find(
        ({ email: userEmail }) => userEmail?.toLowerCase() === trimmedEmail
      );

      if (!existingUser) {
        setLoginError("User doesn't exist.");
        return;
      }

      if (existingUser.secret !== trimmedSecret) {
        setLoginError("Incorrect password.");
        return;
      }

      login(existingUser);
      navigate("/");
    } finally {
      setIsSubmitting(false);
    }
  };
  const getEmailError = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return "";
    }
    if (!trimmedEmail.includes("@")) {
      return "Not a valid email";
    }
    return "";
  };

  const getPasswordError = () => {
    const trimmedSecret = secret.trim();
    if (!trimmedSecret) {
      return "";
    }
    if (trimmedSecret.length <= 8) {
      return "Password should be more than 8 characters.";
    }
    if (!/\d/.test(trimmedSecret)) {
      return "Password should contain at least one number.";
    }
    return "";
  };

  const emailError = getEmailError();
  const passwordError = getPasswordError();
  const isFormValid = !!email && !!secret && !emailError && !passwordError;

  return (
    <Box
      sx={{
        mt: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Avatar sx={{ m: 1, bgcolor: "primary.light" }}></Avatar>
      <Typography variant="h5">Login</Typography>
      <Box sx={{ mt: 1 }}>
        <TextField
          error={!!emailError}
          type="email"
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          helperText={emailError || " "}
        />

        <TextField
          error={!!passwordError}
          type="password"
          margin="normal"
          required
          fullWidth
          id="secret"
          label="Password"
          name="secret"
          autoFocus
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          helperText={passwordError || " "}
        />

        <Button
          disabled={!isFormValid || isSubmitting}
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          onClick={handleLogin}
        >
          Login
        </Button>
        {loginError && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {loginError}
          </Typography>
        )}
        <Grid container justifyContent={"flex-end"}>
          <Grid>
            <Link to="/register"> Don't have an account? Register</Link>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
