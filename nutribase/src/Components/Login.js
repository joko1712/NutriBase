"use client";
import React, { useState } from "react";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import { styled } from "@mui/material/styles";
import { auth, signInWithGoogle } from "../firebase-config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
    AppBar as MuiAppBar,
    Box,
    Toolbar,
    Typography,
    IconButton,
    Container,
    Link,
    Button,
    InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";


const AppBar = styled(MuiAppBar)(({ theme }) => ({
    zIndex: theme.zIndex.drawer + 1,
}));

function Login({ manualSetCurrentUser }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const loginUser = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
            if (userCredential.user.emailVerified) {
                console.log("Email is verified");
                manualSetCurrentUser(userCredential.user);
                router("/");
            } else {
                console.log("Email is not verified");
                window.alert("Please verify your email address.");
            }
        } catch (error) {
            console.error("Login error:", error);
            setError(error.message);
            window.alert("Invalid email or password.");
        }

        setEmail("");
        setPassword("");
    };

    const loginWithGoogle = () => {
        setError("");

        signInWithGoogle(auth)
            .then((res) => {
                console.log(res.user);
            })
            .catch((err) => setError(err.message));
    };

    return (
        <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100%",
                }}>
                <AppBar position='fixed' color='primary'>
                    <Toolbar sx={{ pr: "2px" }}>

                    </Toolbar>
                </AppBar>

                <Container
                    component='main'

                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        mt: 10,
                        flexGrow: 1,
                        width: "100%",
                    }}>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            mt: 2,
                            maxWidth: "50%",
                        }}>
                        <Box sx={{ mt: "5%" }} />
                        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                        </Avatar>
                        <Typography component='h1' variant='h5'>
                            Sign In
                        </Typography>
                        <Box
                            component='form'
                            onSubmit={loginUser}
                            noValidate
                            sx={{ mt: 1, maxWidth: "75%" }}>
                            <TextField
                                margin='normal'
                                required
                                fullWidth
                                id='email'
                                label='Email Address'
                                name='email'
                                autoComplete='email'
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <TextField
                                margin='normal'
                                required
                                fullWidth
                                name='password'
                                label='Password'
                                type={showPassword ? "text" : "password"}
                                id='password'
                                autoComplete='current-password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword((prev) => !prev)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                            <Button
                                type='submit'
                                fullWidth
                                variant='contained'
                                sx={{ mt: 3, mb: 2 }}>
                                Sign In
                            </Button>
                            {error && (
                                <Typography color='error' sx={{ mt: 1 }}>
                                    {error}
                                </Typography>
                            )}

                        </Box>
                    </Box>
                </Container>


            </Box>
    );
}
export default Login;
