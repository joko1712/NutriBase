"use client";

import {
    ThemeProvider,
    CssBaseline,
    Box,
    Button,
    Container,
    Stack,
    Typography,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import theme from "../theme";
import Link from "next/link";

export default function WelcomePage() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ minHeight: "100vh", bgcolor: "#EFEFEF" }}>
                {/* Navbar */}
                <Box
                    className='navbarTop'
                    sx={{
                        color: "white",
                        px: 3,
                        py: 1.5,
                        display: "flex",
                        alignItems: "center",
                    }}>
                    <Typography variant='h6' sx={{ fontWeight: 700 }}>
                        NutriBase
                    </Typography>
                </Box>

                {/* Hero */}
                <Container maxWidth='sm' sx={{ py: 10, textAlign: "center" }}>
                    <Typography
                        variant='h3'
                        sx={{ fontWeight: 800, color: "#764248", mb: 1 }}>
                        NutriBase
                    </Typography>
                    <Typography
                        variant='h6'
                        color='text.secondary'
                        sx={{ mb: 1 }}>
                        Consultório de Nutrição
                    </Typography>
                    <Typography
                        variant='body1'
                        color='text.secondary'
                        sx={{ mb: 5 }}>
                        Bem-vindo! Agende a sua consulta de nutrição de forma
                        rápida e simples.
                    </Typography>

                    <Stack spacing={2} sx={{ maxWidth: 360, mx: "auto" }}>
                        <Button
                            component={Link}
                            href='/agendar'
                            variant='contained'
                            size='large'
                            startIcon={<CalendarMonthIcon />}
                            sx={{
                                py: 1.5,
                                fontWeight: 700,
                                borderRadius: 2,
                                fontSize: "1rem",
                            }}>
                            Agendar Consulta
                        </Button>
                    </Stack>
                </Container>
            </Box>
        </ThemeProvider>
    );
}
