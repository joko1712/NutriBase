"use client";

import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "../../theme";
import AgendarConsulta from "../../Components/AgendarConsulta";

export default function AgendarPage() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AgendarConsulta />
        </ThemeProvider>
    );
}
