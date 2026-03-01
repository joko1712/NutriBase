"use client";

import * as React from "react";
import { Box, Typography } from "@mui/material";

const PROTEIN_MIN = 10, PROTEIN_MAX = 35;
const GLUCID_MIN = 45, GLUCID_MAX = 65;
const LIPID_MIN = 20, LIPID_MAX = 40;

export function MacroSlider({ proteinPct, glucidPct, lipidPct, onChange, net, weight }) {
    const barRef = React.useRef(null);
    const [dragging, setDragging] = React.useState(null);

    const pctFromEvent = (e) => {
        if (!barRef.current) return 0;
        const rect = barRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = clientX - rect.left;
        return Math.max(0, Math.min(100, (x / rect.width) * 100));
    };

    const onPointerDown = (handle) => (e) => {
        e.preventDefault();
        setDragging(handle);
    };

    React.useEffect(() => {
        if (!dragging) return;

        const onMove = (e) => {
            const pos = Math.round(pctFromEvent(e));

            if (dragging === "left") {
                // Moving left handle → protein changes, lipid stays, glucid adjusts
                let p = Math.max(PROTEIN_MIN, Math.min(PROTEIN_MAX, pos));
                let g = 100 - p - lipidPct;
                if (g < GLUCID_MIN) g = GLUCID_MIN;
                if (g > GLUCID_MAX) g = GLUCID_MAX;
                let l = 100 - p - g;
                if (l < LIPID_MIN || l > LIPID_MAX) return;
                onChange({ proteinPct: p, glucidPct: g, lipidPct: l });
            } else {
                // Moving right handle → lipid changes, protein stays, glucid adjusts
                let l = Math.max(LIPID_MIN, Math.min(LIPID_MAX, 100 - pos));
                let g = 100 - proteinPct - l;
                if (g < GLUCID_MIN) g = GLUCID_MIN;
                if (g > GLUCID_MAX) g = GLUCID_MAX;
                let p = 100 - g - l;
                if (p < PROTEIN_MIN || p > PROTEIN_MAX) return;
                onChange({ proteinPct: p, glucidPct: g, lipidPct: l });
            }
        };

        const onUp = () => setDragging(null);

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("touchend", onUp);

        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
            window.removeEventListener("touchmove", onMove);
            window.removeEventListener("touchend", onUp);
        };
    }, [dragging, proteinPct, glucidPct, lipidPct, onChange]);

    const handleStyle = {
        position: "absolute",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: 28,
        height: 44,
        bgcolor: "rgba(0,0,0,0.35)",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "ew-resize",
        zIndex: 3,
        "&:hover": { bgcolor: "rgba(0,0,0,0.5)" },
    };

    const n = parseFloat(net);
    const w = parseFloat(weight);
    const hasNet = Number.isFinite(n);
    const hasWeight = Number.isFinite(w) && w > 0;

    const protGrams = hasNet ? ((n * (proteinPct / 100)) / 4).toFixed(1) : null;
    const glucGrams = hasNet ? ((n * (glucidPct / 100)) / 4).toFixed(1) : null;
    const lipGrams = hasNet ? ((n * (lipidPct / 100)) / 9).toFixed(1) : null;

    const protGKg = hasNet && hasWeight ? ((protGrams / w).toFixed(1)) : null;
    const glucGKg = hasNet && hasWeight ? ((glucGrams / w).toFixed(1)) : null;
    const lipGKg = hasNet && hasWeight ? ((lipGrams / w).toFixed(1)) : null;

    const helperText = (grams, gkg) => {
        if (grams === null) return "";
        let txt = `${grams}g`;
        if (gkg !== null) txt += ` | ${gkg} g/kg`;
        return txt;
    };

    return (
        <Box sx={{ userSelect: "none", py: 1 }}>
            <Box sx={{ display: "flex", mb: 0.5 }}>
                <Box sx={{ width: `${proteinPct}%`, textAlign: "center" }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11 }}>
                        Proteínas ({PROTEIN_MIN}-{PROTEIN_MAX}%)
                    </Typography>
                </Box>
                <Box sx={{ width: `${glucidPct}%`, textAlign: "center" }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11 }}>
                        Hidratos ({GLUCID_MIN}-{GLUCID_MAX}%)
                    </Typography>
                </Box>
                <Box sx={{ width: `${lipidPct}%`, textAlign: "center" }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11 }}>
                        Lípidos ({LIPID_MIN}-{LIPID_MAX}%)
                    </Typography>
                </Box>
            </Box>

            <Box
                ref={barRef}
                sx={{
                    position: "relative",
                    height: 44,
                    borderRadius: "22px",
                    overflow: "visible",
                    display: "flex",
                    cursor: dragging ? "ew-resize" : "default",
                }}
            >
                <Box
                    sx={{
                        width: `${proteinPct}%`,
                        background: "linear-gradient(135deg, #6B7FC8, #8B7EB5)",
                        borderRadius: "22px 0 0 22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                    }}
                >
                    <Typography variant="body2" sx={{ color: "white", fontWeight: 700, fontSize: 13 }}>
                        {proteinPct}%
                    </Typography>
                </Box>

                <Box
                    sx={{
                        width: `${glucidPct}%`,
                        background: "linear-gradient(135deg, #8B7EB5, #B87BA0)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                    }}
                >
                    <Typography variant="body2" sx={{ color: "white", fontWeight: 700, fontSize: 13 }}>
                        {glucidPct}%
                    </Typography>
                </Box>

                <Box
                    sx={{
                        width: `${lipidPct}%`,
                        background: "linear-gradient(135deg, #B87BA0, #C87B9B)",
                        borderRadius: "0 22px 22px 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                    }}
                >
                    <Typography variant="body2" sx={{ color: "white", fontWeight: 700, fontSize: 13 }}>
                        {lipidPct}%
                    </Typography>
                </Box>

                <Box
                    onMouseDown={onPointerDown("left")}
                    onTouchStart={onPointerDown("left")}
                    sx={{ ...handleStyle, left: `${proteinPct}%` }}
                >
                    <Typography sx={{ color: "white", fontSize: 12, fontWeight: 700, lineHeight: 1 }}>| |</Typography>
                </Box>

                <Box
                    onMouseDown={onPointerDown("right")}
                    onTouchStart={onPointerDown("right")}
                    sx={{ ...handleStyle, left: `${proteinPct + glucidPct}%` }}
                >
                    <Typography sx={{ color: "white", fontSize: 12, fontWeight: 700, lineHeight: 1 }}>| |</Typography>
                </Box>
            </Box>

            <Box sx={{ display: "flex", mt: 0.5 }}>
                <Box sx={{ width: `${proteinPct}%`, textAlign: "center" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                        {helperText(protGrams, protGKg)}
                    </Typography>
                </Box>
                <Box sx={{ width: `${glucidPct}%`, textAlign: "center" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                        {helperText(glucGrams, glucGKg)}
                    </Typography>
                </Box>
                <Box sx={{ width: `${lipidPct}%`, textAlign: "center" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                        {helperText(lipGrams, lipGKg)}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
