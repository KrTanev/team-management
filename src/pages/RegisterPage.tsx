import {
  Avatar,
  Box,
  Button,
  Container,
  CssBaseline,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link } from "react-router-dom";

export const RegisterPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [confirmSecret, setConfirmSecret] = useState("");

  const handleRegister = async () => {};

  const validateFirstName = () => {
    const trimmed = firstName.trim();
    if (!trimmed) {
      return "First name is required";
    }
    if (trimmed.charAt(0) !== trimmed.charAt(0).toUpperCase()) {
      return "First name must start with uppercase";
    }
    return "";
  };

  const validateLastName = () => {
    const trimmed = lastName.trim();
    if (!trimmed) {
      return "Last name is required";
    }
    if (trimmed.charAt(0) !== trimmed.charAt(0).toUpperCase()) {
      return "Last name must start with uppercase";
    }
    return "";
  };

  const validateEmail = () => {
    if (!email.includes("@")) {
      return false;
    }

    return true;
  };

  const validatePassword = () => {
    if (secret.length <= 8) {
      return "Password should be more than 8.";
    }
    let isValidNumber = false;

    for (const char of secret) {
      if (!isNaN(Number(char))) {
        isValidNumber = true;
      }
    }
    if (isValidNumber == false) {
      return "Password should contain at least one number.";
    }
  };

  const validateConfirmPassword = () => {
    if (confirmSecret !== secret) {
      return true;
    }

    return false;
  };

  const firstNameError = validateFirstName();
  const lastNameError = validateLastName();
  const isEmailValid = validateEmail();
  const passwordErrorMessage = validatePassword();
  const isConfirmPasswordInvalid = !!validateConfirmPassword();
  const isFormValid =
    !firstNameError &&
    !lastNameError &&
    isEmailValid &&
    !passwordErrorMessage &&
    !isConfirmPasswordInvalid;

  return (
    <>
      <Container maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            mt: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "primary.light" }}></Avatar>
          <Typography variant="h5">Register</Typography>
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  error={!!firstNameError}
                  name="firstName"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  autoFocus
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  helperText={firstNameError || " "}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  error={!!lastNameError}
                  name="lastName"
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  autoFocus
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  helperText={lastNameError || " "}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  error={!isEmailValid}
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  helperText={!isEmailValid && "Not a valid email"}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  error={!!passwordErrorMessage}
                  required
                  fullWidth
                  name="secret"
                  label="Password"
                  type="password"
                  id="secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  helperText={passwordErrorMessage}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  error={isConfirmPasswordInvalid}
                  required
                  fullWidth
                  name="password"
                  label="Confirm Password"
                  type="password"
                  id="password"
                  value={confirmSecret}
                  onChange={(e) => setConfirmSecret(e.target.value)}
                  helperText={
                    isConfirmPasswordInvalid && "Passwords don't match"
                  }
                />
              </Grid>
            </Grid>
            <Button
              disabled={!isFormValid}
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={handleRegister}
            >
              Register
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid>
                <Link to="/login">Already have an account? Login</Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
    </>
  );
};
