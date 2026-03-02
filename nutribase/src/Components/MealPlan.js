"use client";

import * as React from "react";
import {
    Box,
    Button,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const DEFAULT_MEALS = [
    { id: "pa", name: "Pequeno-Almoço", ref: "20-25%", pct: "" },
    { id: "mm", name: "Meio da manhã", ref: "5-10%", pct: "" },
    { id: "al", name: "Almoço", ref: "30-35%", pct: "" },
    { id: "l1", name: "Lanche 1", ref: "5-10%", pct: "" },
    { id: "l2", name: "Lanche 2", ref: "5-10%", pct: "" },
    { id: "ja", name: "Jantar", ref: "25-30%", pct: "" },
    { id: "ce", name: "Ceia", ref: "5-10%", pct: "" },
];

export function MealPlan({ meals, onChange, net, proteinG, glucidG, lipidG }) {
    React.useEffect(() => {
        if (!meals || meals.length === 0) {
            onChange(DEFAULT_MEALS.map((m) => ({ ...m, id: crypto.randomUUID() })));
        }
    }, []);

    const netVal = parseFloat(net);
    const hasNet = Number.isFinite(netVal);
    const pG = parseFloat(proteinG);
    const gG = parseFloat(glucidG);
    const lG = parseFloat(lipidG);

    const updateMeal = (id, field, value) => {
        onChange((meals || []).map((m) => (m.id === id ? { ...m, [field]: value } : m)));
    };

    const addMeal = () => {
        onChange([
            ...(meals || []),
            { id: crypto.randomUUID(), name: "", ref: "", pct: "" },
        ]);
    };

    const removeMeal = (id) => {
        onChange((meals || []).filter((m) => m.id !== id));
    };

    if (!meals || meals.length === 0) return null;

    const totalPct = meals.reduce((sum, m) => {
        const p = parseFloat(m.pct);
        return sum + (Number.isFinite(p) ? p : 0);
    }, 0);

    const totalKcal = hasNet
        ? meals.reduce((sum, m) => {
            const p = parseFloat(m.pct);
            return sum + (Number.isFinite(p) ? Math.round(netVal * p / 100) : 0);
        }, 0)
        : "";

    const cellSx = { py: 0.5, px: 1 };
    const headSx = { fontWeight: 700, py: 0.5, px: 1 };

    return (
        <Stack spacing={3}>
            {/* ── Table 1: Distribuição por Refeição ─────────── */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Distribuição por Refeição
            </Typography>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={headSx}>Referência</TableCell>
                            <TableCell sx={headSx}>Refeição</TableCell>
                            <TableCell sx={headSx} align="center">%</TableCell>
                            <TableCell sx={headSx} align="center">kcal</TableCell>
                            <TableCell sx={{ ...headSx, width: 40 }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {meals.map((meal) => {
                            const p = parseFloat(meal.pct);
                            const kcal = hasNet && Number.isFinite(p) ? Math.round(netVal * p / 100) : "";
                            return (
                                <TableRow key={meal.id}>
                                    <TableCell sx={{ ...cellSx, color: "text.secondary", whiteSpace: "nowrap" }}>
                                        <TextField
                                            size="small" variant="standard"
                                            value={meal.ref}
                                            onChange={(e) => updateMeal(meal.id, "ref", e.target.value)}
                                            sx={{ width: 90 }}
                                            inputProps={{ style: { fontSize: 13 } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={cellSx}>
                                        <TextField
                                            size="small" variant="standard" fullWidth
                                            value={meal.name}
                                            onChange={(e) => updateMeal(meal.id, "name", e.target.value)}
                                            placeholder="Nome da refeição"
                                            inputProps={{ style: { fontWeight: 600, fontSize: 13 } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={cellSx} align="center">
                                        <TextField
                                            size="small" variant="standard" type="number"
                                            value={meal.pct}
                                            onChange={(e) => updateMeal(meal.id, "pct", e.target.value)}
                                            sx={{ width: 70 }}
                                            inputProps={{ style: { textAlign: "center", fontSize: 13 }, min: 0, max: 100, step: 1 }}
                                        />
                                    </TableCell>
                                    <TableCell sx={cellSx} align="center">
                                        <Typography variant="body2" sx={{ fontSize: 13 }}>
                                            {kcal}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={cellSx}>
                                        <IconButton size="small" color="error" onClick={() => removeMeal(meal.id)} title="Remover refeição">
                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        <TableRow sx={{ "& td": { borderTop: "2px solid #ccc" } }}>
                            <TableCell sx={cellSx} />
                            <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Total</TableCell>
                            <TableCell sx={{ ...cellSx, fontWeight: 700 }} align="center">
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: 13,
                                        color: Math.abs(totalPct - 100) < 0.01 ? "success.main" : totalPct > 0 ? "error.main" : "text.primary",
                                    }}
                                >
                                    {totalPct > 0 ? `${Math.round(totalPct * 10) / 10}%` : ""}
                                </Typography>
                            </TableCell>
                            <TableCell sx={{ ...cellSx, fontWeight: 700 }} align="center">
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                                    {totalKcal}
                                </Typography>
                            </TableCell>
                            <TableCell sx={cellSx} />
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addMeal}>
                    Adicionar Refeição
                </Button>
            </Box>

            {/* ── Table 2: Distribuição Macronutrientes por Refeição ── */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 2 }}>
                Distribuição de Macronutrientes por Refeição
            </Typography>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={headSx}>Refeição</TableCell>
                            <TableCell sx={headSx} align="center">%</TableCell>
                            <TableCell sx={headSx} align="center">Proteínas (g)</TableCell>
                            <TableCell sx={headSx} align="center">Glícidos (g)</TableCell>
                            <TableCell sx={headSx} align="center">Lípidos (g)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {meals.map((meal) => {
                            const p = parseFloat(meal.pct);
                            const hasPct = Number.isFinite(p);
                            const mProt = hasPct && Number.isFinite(pG) ? (p / 100 * pG).toFixed(1) : "";
                            const mGluc = hasPct && Number.isFinite(gG) ? (p / 100 * gG).toFixed(1) : "";
                            const mLip = hasPct && Number.isFinite(lG) ? (p / 100 * lG).toFixed(1) : "";
                            return (
                                <TableRow key={meal.id}>
                                    <TableCell sx={{ ...cellSx, fontWeight: 600, fontSize: 13 }}>
                                        {meal.name || "—"}
                                    </TableCell>
                                    <TableCell sx={cellSx} align="center">
                                        <Typography variant="body2" sx={{ fontSize: 13 }}>
                                            {hasPct ? `${p}%` : ""}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={cellSx} align="center">
                                        <Typography variant="body2" sx={{ fontSize: 13 }}>{mProt}</Typography>
                                    </TableCell>
                                    <TableCell sx={cellSx} align="center">
                                        <Typography variant="body2" sx={{ fontSize: 13 }}>{mGluc}</Typography>
                                    </TableCell>
                                    <TableCell sx={cellSx} align="center">
                                        <Typography variant="body2" sx={{ fontSize: 13 }}>{mLip}</Typography>
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {/* ── Totals row ─────────────────────── */}
                        <TableRow sx={{ "& td": { borderTop: "2px solid #ccc" } }}>
                            <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Total</TableCell>
                            <TableCell sx={{ ...cellSx, fontWeight: 700 }} align="center">
                                {totalPct > 0 ? `${Math.round(totalPct * 10) / 10}%` : ""}
                            </TableCell>
                            <TableCell sx={{ ...cellSx, fontWeight: 700 }} align="center">
                                {Number.isFinite(pG) ? pG.toFixed(1) : ""}
                            </TableCell>
                            <TableCell sx={{ ...cellSx, fontWeight: 700 }} align="center">
                                {Number.isFinite(gG) ? gG.toFixed(1) : ""}
                            </TableCell>
                            <TableCell sx={{ ...cellSx, fontWeight: 700 }} align="center">
                                {Number.isFinite(lG) ? lG.toFixed(1) : ""}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    );
}
