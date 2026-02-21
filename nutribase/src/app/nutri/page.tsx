"use client";

import dynamic from "next/dynamic";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "../../theme";

const AuthGate = dynamic(() => import("../AuthGate"), { ssr: false });

export default function NutriPage() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthGate />
        </ThemeProvider>
    );
}
