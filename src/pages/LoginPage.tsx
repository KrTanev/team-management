import { Avatar, Box, Button, Grid, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link } from "react-router-dom";

export const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [secret, setSecret] = useState("");

    const handleLogin = () => {};

    const getEmailError = () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            return "";
        }
        if (!trimmedEmail.includes('@')) {
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
    const isFormValid =
        !!email &&
        !!secret &&
        !emailError &&
        !passwordError;

    return (
        <Box 
            sx={{
                mt: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            
            <Avatar sx={{ m: 1, bgcolor: "primary.light"}}>
            </Avatar>
            <Typography variant="h5">Login</Typography>
            <Box sx={{ mt: 1}}>
                <TextField 
                    error={!!emailError}
                    type = "email"
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    helperText= {emailError || " "}
                />

                <TextField 
                    error = {!!passwordError}
                    type = "password"
                    margin="normal"
                    required
                    fullWidth
                    id="secret"
                    label="Password"
                    name="secret"
                    autoFocus 
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    helperText= {passwordError || " "}
                />

                <Button
                    disabled = {!isFormValid}
                    fullWidth
                    variant="contained"
                    sx={{ mt:3, mb: 2}}
                    onClick={handleLogin}
                >
                    Login
                </Button>
                <Grid container justifyContent={"flex-end"}>
                    <Grid>
                        <Link to ="/register"> Don't have an account? Register</Link>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}