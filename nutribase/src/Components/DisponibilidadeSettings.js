"use client";

import * as React from "react";
import {
    Box,
    Button,
    Chip,
    Container,
    IconButton,
    Paper,
    Stack,
    Typography,
    Alert,
    Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import LogoutIcon from "@mui/icons-material/Logout";
import SaveIcon from "@mui/icons-material/Save";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase-config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import dayjs from "dayjs";
import "dayjs/locale/pt";

dayjs.locale("pt");

const ALL_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30",
];

const WEEKDAY_HEADERS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function getMonthDays(year, month) {
    const first = dayjs().year(year).month(month).startOf("month");
    const daysInMonth = first.daysInMonth();
    const startDow = (first.day() + 6) % 7;
    const days = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        days.push(first.date(d).format("YYYY-MM-DD"));
    }
    return days;
}

function formatMonthLabel(year, month) {
    return dayjs().year(year).month(month).format("MMMM YYYY");
}

export default function DisponibilidadeSettings({ onBack }) {
    const today = dayjs();
    const [viewYear, setViewYear] = React.useState(today.year());
    const [viewMonth, setViewMonth] = React.useState(today.month());
    const [selectedDate, setSelectedDate] = React.useState(null);

    const [availability, setAvailability] = React.useState({});
    const [saving, setSaving] = React.useState(false);
    const [hasChanges, setHasChanges] = React.useState(false);
    const [snackbar, setSnackbar] = React.useState({ open: false, message: "", severity: "success" });

    const monthDocId = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;

    React.useEffect(() => {
        const fetchMonth = async () => {
            try {
                const snap = await getDoc(doc(db, "settings", monthDocId));
                if (snap.exists()) {
                    setAvailability(snap.data());
                } else {
                    setAvailability({});
                }
            } catch (err) {
                console.error("Error fetching availability:", err);
                setAvailability({});
            }
            setHasChanges(false);
        };
        fetchMonth();
        setSelectedDate(null);
    }, [monthDocId]);

    const monthDays = React.useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);

    const goNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else {
            setViewMonth((m) => m + 1);
        }
    };

    const goPrevMonth = () => {
        const now = dayjs();
        if (viewYear === now.year() && viewMonth <= now.month()) return;
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else {
            setViewMonth((m) => m - 1);
        }
    };

    const canGoPrev = (() => {
        const now = dayjs();
        return !(viewYear === now.year() && viewMonth <= now.month());
    })();

    const toggleSlot = (dateKey, slot) => {
        setAvailability((prev) => {
            const dateSlots = prev[dateKey] || [];
            const updated = dateSlots.includes(slot)
                ? dateSlots.filter((s) => s !== slot)
                : [...dateSlots, slot].sort();
            return { ...prev, [dateKey]: updated };
        });
        setHasChanges(true);
    };

    const toggleAllSlots = (dateKey) => {
        setAvailability((prev) => {
            const dateSlots = prev[dateKey] || [];
            const updated = dateSlots.length === ALL_SLOTS.length ? [] : [...ALL_SLOTS];
            return { ...prev, [dateKey]: updated };
        });
        setHasChanges(true);
    };

    const clearDate = (dateKey) => {
        setAvailability((prev) => {
            const next = { ...prev };
            delete next[dateKey];
            return next;
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const toSave = {};
            for (const [k, v] of Object.entries(availability)) {
                if (Array.isArray(v) && v.length > 0) {
                    toSave[k] = v;
                }
            }
            await setDoc(doc(db, "settings", monthDocId), toSave);
            setHasChanges(false);
            setSnackbar({ open: true, message: "Disponibilidade guardada com sucesso!", severity: "success" });
        } catch (err) {
            console.error("Error saving availability:", err);
            setSnackbar({ open: true, message: "Erro ao guardar.", severity: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/agendar`;
        navigator.clipboard.writeText(url);
        setSnackbar({ open: true, message: "Link copiado!", severity: "success" });
    };

    const handleLogout = async () => {
        try { await signOut(auth); } catch (err) { console.error(err); }
    };

    const selectedSlots = selectedDate ? (availability[selectedDate] || []) : [];
    const selectedDayjs = selectedDate ? dayjs(selectedDate) : null;
    const isPast = (dateKey) => dayjs(dateKey).isBefore(dayjs(), "day");

    const configuredDays = React.useMemo(() => {
        return monthDays.filter((d) => d && availability[d] && availability[d].length > 0).length;
    }, [monthDays, availability]);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#EFEFEF" }}>
            {/* Navbar */}
            <Box className="navbarTop" sx={{ color: "white", px: 3, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton size="small" sx={{ color: "white" }} onClick={onBack}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>NutriBase</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Teresa Pereira Soares {<StarBorderIcon />}
                    </Typography>
                    <IconButton size="small" sx={{ color: "white" }} onClick={handleLogout} title="Logout">
                        <LogoutIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Box>

            <Container maxWidth={false} sx={{ py: 4 }}>
                {/* Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            Disponibilidade
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Selecione um dia no calendário e configure os horários disponíveis
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<ContentCopyIcon />}
                            onClick={handleCopyLink}
                        >
                            Copiar link
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                            sx={{ bgcolor: "#764248" }}
                        >
                            {saving ? "A guardar..." : "Guardar"}
                        </Button>
                    </Stack>
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                    {/* ── Left: Calendar ─────────────────────────────────── */}
                    <Paper sx={{ p: 3, flex: "0 0 auto", width: { xs: "100%", md: 380 } }}>
                        {/* Month navigation */}
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                            <IconButton size="small" onClick={goPrevMonth} disabled={!canGoPrev}>
                                <ArrowBackIosNewIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="h6" sx={{ fontWeight: 700, textTransform: "capitalize" }}>
                                {formatMonthLabel(viewYear, viewMonth)}
                            </Typography>
                            <IconButton size="small" onClick={goNextMonth}>
                                <ArrowForwardIosIcon fontSize="small" />
                            </IconButton>
                        </Stack>

                        {/* Weekday headers */}
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, mb: 0.5 }}>
                            {WEEKDAY_HEADERS.map((d) => (
                                <Typography key={d} variant="caption" sx={{ textAlign: "center", fontWeight: 700, color: "text.secondary" }}>
                                    {d}
                                </Typography>
                            ))}
                        </Box>

                        {/* Day cells */}
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
                            {monthDays.map((dateKey, idx) => {
                                if (!dateKey) {
                                    return <Box key={`empty-${idx}`} />;
                                }
                                const day = dayjs(dateKey).date();
                                const isSelected = selectedDate === dateKey;
                                const hasSlots = availability[dateKey] && availability[dateKey].length > 0;
                                const past = isPast(dateKey);
                                return (
                                    <Box
                                        key={dateKey}
                                        onClick={() => !past && setSelectedDate(dateKey)}
                                        sx={{
                                            aspectRatio: "1",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderRadius: 1.5,
                                            cursor: past ? "default" : "pointer",
                                            position: "relative",
                                            opacity: past ? 0.35 : 1,
                                            bgcolor: isSelected ? "#764248" : "transparent",
                                            color: isSelected ? "white" : "text.primary",
                                            fontWeight: isSelected ? 700 : 400,
                                            fontSize: "0.85rem",
                                            border: hasSlots && !isSelected ? "2px solid #764248" : "2px solid transparent",
                                            "&:hover": past ? {} : {
                                                bgcolor: isSelected ? "#5a3238" : "action.hover",
                                            },
                                        }}
                                    >
                                        {day}
                                        {hasSlots && !isSelected && (
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    bottom: 2,
                                                    width: 5,
                                                    height: 5,
                                                    borderRadius: "50%",
                                                    bgcolor: "#764248",
                                                }}
                                            />
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                            {configuredDays} dia{configuredDays !== 1 ? "s" : ""} configurado{configuredDays !== 1 ? "s" : ""} este mês
                        </Typography>
                    </Paper>

                    {/* ── Right: Time slots for selected day ────────────── */}
                    <Paper sx={{ p: 3, flex: 1 }}>
                        {!selectedDate ? (
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
                                <Typography variant="body1" color="text.secondary">
                                    Selecione um dia no calendário para configurar os horários
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            {selectedDayjs?.format("dddd, D [de] MMMM")}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedSlots.length} de {ALL_SLOTS.length} horários ativos
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1}>
                                        <Chip
                                            label={selectedSlots.length === ALL_SLOTS.length ? "Limpar tudo" : "Selecionar tudo"}
                                            size="small"
                                            variant="outlined"
                                            onClick={() => toggleAllSlots(selectedDate)}
                                            sx={{ cursor: "pointer" }}
                                        />
                                        {selectedSlots.length > 0 && (
                                            <Chip
                                                label="Remover dia"
                                                size="small"
                                                color="error"
                                                variant="outlined"
                                                onClick={() => clearDate(selectedDate)}
                                                sx={{ cursor: "pointer" }}
                                            />
                                        )}
                                    </Stack>
                                </Stack>

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", md: "repeat(5, 1fr)" },
                                        gap: 1,
                                    }}
                                >
                                    {ALL_SLOTS.map((slot) => {
                                        const active = selectedSlots.includes(slot);
                                        return (
                                            <Button
                                                key={slot}
                                                size="small"
                                                variant={active ? "contained" : "outlined"}
                                                onClick={() => toggleSlot(selectedDate, slot)}
                                                sx={{
                                                    py: 1,
                                                    fontWeight: 600,
                                                    borderRadius: 2,
                                                    ...(active
                                                        ? { bgcolor: "#764248", "&:hover": { bgcolor: "#5a3238" } }
                                                        : { color: "text.secondary", borderColor: "divider" }),
                                                }}
                                            >
                                                {slot}
                                            </Button>
                                        );
                                    })}
                                </Box>
                            </>
                        )}
                    </Paper>
                </Stack>
            </Container>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
