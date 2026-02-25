"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Button,
    Container,
    Grid,
    IconButton,
    Paper,
    Stack,
    TextField,
    Typography,
    CircularProgress,
    Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/pt-br";
import dayjs from "dayjs";
import { db } from "../firebase-config";
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import NativeSelect from "@mui/material/NativeSelect";
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem"

const SLOTS_BY_DAY = {
    1: ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"], // Mon
    2: ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00"], // Tue
    3: ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"], // Wed
    4: ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00"], // Thu
    5: ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"], // Fri
    6: ["09:00", "09:30", "10:00", "10:30", "11:00"],                                     // Sat
    0: [],                                                                                          // Sun
};

function getSlotsForDate(dateKey) {
    const dow = dayjs(dateKey).day();
    return SLOTS_BY_DAY[dow] || [];
}

import updateLocale from "dayjs/plugin/updateLocale";

dayjs.extend(updateLocale);

dayjs.updateLocale("en", {
    weekStart: 1
});

function validatePhone(phone) {
    if (!phone) return "";
    const cleaned = phone.replace(/\s/g, "");
    const ptPattern = /^(\+351)?[29]\d{8}$/;
    const mobilePattern = /^(\+351)?9\d{8}$/;
    if (ptPattern.test(cleaned) || mobilePattern.test(cleaned) || /^\d{9}$/.test(cleaned)) return "";
    return "Formato inválido (ex: 912345678 ou +351912345678)";
}

function validateEmail(email) {
    if (!email) return "";
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email) ? "" : "Email inválido";
}

export default function AgendarConsulta() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState("");

    const [name, setName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState(null);
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [reason, setReason] = useState("");
    const [tipoConsulta, setTipoConsulta] = useState("");
    const [checked, setChecked] = useState(false)


    const [monthData, setMonthData] = useState({});
    const [loadingMonth, setLoadingMonth] = useState(null);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [calendarMonth, setCalendarMonth] = useState(dayjs());

    const fetchMonth = React.useCallback(async (monthKey) => {
        if (monthData[monthKey] !== undefined) return;
        setLoadingMonth(monthKey);
        try {
            const snap = await getDoc(doc(db, "settings", monthKey));
            setMonthData((prev) => ({
                ...prev,
                [monthKey]: snap.exists() ? snap.data() : {},
            }));
        } catch (err) {
            console.error("Error fetching availability:", err);
            setMonthData((prev) => ({ ...prev, [monthKey]: {} }));
        } finally {
            setLoadingMonth(null);
        }
    }, [monthData]);

    useEffect(() => {
        const key = dayjs().format("YYYY-MM");
        fetchMonth(key);
    }, []);

    useEffect(() => {
        const key = calendarMonth.format("YYYY-MM");
        fetchMonth(key);
    }, [calendarMonth]);

    useEffect(() => {
        if (step === 3) {
            const timer = setTimeout(() => router.push("/"), 60000);
            return () => clearTimeout(timer);
        }
    }, [step, router]);

    const availableSlots = React.useMemo(() => {
        if (!selectedDate) return [];
        const dateKey = selectedDate.format("YYYY-MM-DD");
        const monthKey = selectedDate.format("YYYY-MM");
        const daySlots = getSlotsForDate(dateKey);
        if (daySlots.length === 0) return [];
        const monthUnavail = monthData[monthKey];
        const blockedSlots = new Set(monthUnavail?.[dateKey] || []);
        return daySlots.filter((s) => !blockedSlots.has(s));
    }, [selectedDate, monthData]);

    const isLoadingSlots = React.useMemo(() => {
        if (!selectedDate) return false;
        const monthKey = selectedDate.format("YYYY-MM");
        return loadingMonth === monthKey;
    }, [selectedDate, loadingMonth]);

    const shouldDisableDate = React.useCallback((date) => {
        const dateKey = date.format("YYYY-MM-DD");
        const monthKey = date.format("YYYY-MM");
        if (date.year() > 2030) return true;
        const daySlots = getSlotsForDate(dateKey);
        if (daySlots.length === 0) return true;
        const monthUnavail = monthData[monthKey];
        if (!monthUnavail) return false;
        const blockedSlots = monthUnavail[dateKey];
        return Array.isArray(blockedSlots) && blockedSlots.length >= daySlots.length;
    }, [monthData]);

    React.useEffect(() => {
        if (selectedTime && !availableSlots.includes(selectedTime)) {
            setSelectedTime("");
        }
    }, [availableSlots, selectedTime]);

    const phoneError = validatePhone(phone);
    const emailError = validateEmail(email);
    const isDateOfBirthValid = dateOfBirth !== null && dateOfBirth.isValid() && dateOfBirth.isBefore(dayjs());
    const canSubmit = name.trim() !== "" && isDateOfBirthValid && tipoConsulta !== "" && emailError !== "Email inválido" && phoneError !== "Phone inválido" && !submitting && checked == true;

    const handleChange = () => {
        setChecked(!checked);
    };
    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setError("");
        try {
            const bookedDate = selectedDate.format("YYYY-MM-DD");
            await addDoc(collection(db, "bookings"), {
                name: name.trim(),
                dateOfBirth: dateOfBirth ? dateOfBirth.format("YYYY-MM-DD") : "",
                email: email.trim(),
                phone: phone.trim(),
                reason: reason.trim(),
                tipoConsulta: tipoConsulta,
                date: bookedDate,
                time: selectedTime,
                createdAt: serverTimestamp(),
            });

            const monthKey = selectedDate.format("YYYY-MM");
            const settingsRef = doc(db, "settings", monthKey);
            const snap = await getDoc(settingsRef);
            const data = snap.exists() ? snap.data() : {};
            const dateSlots = data[bookedDate] || [];
            const [h, m] = selectedTime.split(":").map(Number);
            const totalMin = h * 60 + m + 30;
            const nextSlot = `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
            const slotsToBlock = [selectedTime, nextSlot];
            const blockedSet = new Set([...dateSlots, ...slotsToBlock]);
            const updated = [...blockedSet].sort();
            await setDoc(settingsRef, { ...data, [bookedDate]: updated });

            setStep(3);
        } catch (err) {
            console.error("Error saving booking:", err);
            setError("Erro ao agendar consulta. Tente novamente.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setStep(1);
        setSelectedDate(null);
        setSelectedTime("");
        setName("");
        setDateOfBirth(null);
        setEmail("");
        setPhone("");
        setReason("");
        setTipoConsulta("");
        setError("");
    };

    const renderNavbar = (showBack) => (
        <Box
            className="navbarTop"
            sx={{
                color: "white",
                px: 3,
                py: 1.5,
                display: "flex",
                alignItems: "center",
            }}
        >
            {showBack && (
                <IconButton size="small" sx={{ color: "white" }} onClick={() => setStep(1)}>
                    <ArrowBackIcon />
                </IconButton>
            )}
            <Typography variant="h6" sx={{ fontWeight: 700, ml: showBack ? 1 : 0 }}>
                NutriBase
            </Typography>
        </Box>
    );

    if (step === 1) {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: "#EFEFEF" }}>
                {renderNavbar(false)}
                <Container maxWidth="" sx={{ py: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Agendar Consulta
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Selecione a data e hora pretendida
                    </Typography>

                    <Grid container spacing={3}>
                        {/* Left: Calendar */}
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Paper sx={{ overflow: "visible", p: 2 }}>
                                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                                    <DateCalendar
                                        value={selectedDate}
                                        onChange={(newValue) => setSelectedDate(newValue)}
                                        onMonthChange={(month) => setCalendarMonth(month)}
                                        minDate={dayjs()}
                                        shouldDisableDate={shouldDisableDate}
                                        fixedWeekNumber={6}
                                        sx={{
                                            width: "100%",
                                            maxHeight: "none",
                                            height: "auto",

                                            "& .MuiPickersCalendarHeader-root": { px: 2, py: 2 },
                                            "& .MuiPickersCalendarHeader-label": { fontSize: "1.3rem", fontWeight: 700 },

                                            "& .MuiDayCalendar-header": {
                                                justifyContent: "space-around",
                                            },
                                            "& .MuiDayCalendar-weekDayLabel": {
                                                fontSize: "1rem",
                                                fontWeight: 700,
                                                width: 56,
                                                height: 40,
                                            },

                                            "& .MuiPickersDay-root": {
                                                width: 56,
                                                height: 56,
                                                fontSize: "1.05rem",
                                                fontWeight: 600,
                                                borderRadius: 2,
                                                margin: "2px",
                                            },

                                            "& .MuiPickersSlideTransition-root": {
                                                minHeight: 6 * 60 + 32,
                                                overflow: "visible",
                                            },

                                            "& .MuiDayCalendar-monthContainer": {
                                                height: "auto",
                                            },
                                            "& .MuiDayCalendar-weekContainer": {
                                                justifyContent: "space-around",
                                                my: 0.25,
                                            },
                                        }}
                                    />
                                </LocalizationProvider>
                            </Paper>
                        </Grid>



                        {/* Right: Time slots */}
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Paper sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                    Horários disponíveis
                                </Typography>

                                {!selectedDate ? (
                                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                                            Selecione uma data para ver os horários disponíveis
                                        </Typography>
                                    </Box>
                                ) : isLoadingSlots ? (
                                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <CircularProgress size={28} />
                                    </Box>
                                ) : availableSlots.length === 0 ? (
                                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                                            Sem horários disponíveis para esta data
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(2, 1fr)",
                                            gap: 1,
                                            flex: 1,
                                            alignContent: "start",
                                        }}
                                    >
                                        {availableSlots.map((time) => (
                                            <Button
                                                key={time}
                                                variant={selectedTime === time ? "contained" : "outlined"}
                                                onClick={() => setSelectedTime(time)}
                                                sx={{
                                                    py: 1,
                                                    borderRadius: 2,
                                                    fontWeight: 600,
                                                    ...(selectedTime === time
                                                        ? { bgcolor: "primary.main", color: "white" }
                                                        : {}),
                                                }}
                                            >
                                                {time}
                                            </Button>
                                        ))}
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Continue */}
                    <Button
                        variant="contained"
                        fullWidth
                        disabled={!selectedDate || !selectedTime}
                        onClick={() => setStep(2)}
                        sx={{ mt: 3, py: 1.5, fontWeight: 700, borderRadius: 2 }}
                    >
                        Continuar
                    </Button>
                </Container>
            </Box>
        );
    }

    if (step === 2) {
        return (
            <Box sx={{ minHeight: "100vh", bgcolor: "#EFEFEF" }}>
                {renderNavbar(true)}
                <Container maxWidth="sm" sx={{ py: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
                        Dados Pessoais
                    </Typography>

                    <Paper sx={{ p: 3 }}>
                        <Stack spacing={2.5}>
                            <TextField
                                label="Nome completo"
                                fullWidth
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                                <DatePicker
                                    label="Data de Nascimento"
                                    value={dateOfBirth}
                                    onChange={(val) => setDateOfBirth(val)}
                                    maxDate={dayjs()}
                                    format="DD/MM/YYYY"
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
                                            error: dateOfBirth !== null && !isDateOfBirthValid,
                                            helperText: dateOfBirth !== null && !isDateOfBirthValid ? "Data de nascimento inválida" : "",
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                            <TextField
                                label="Email"
                                fullWidth
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={!!emailError}
                                helperText={emailError}
                                placeholder="exemplo@email.com"
                            />
                            <TextField
                                label="Telefone"
                                fullWidth
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                error={!!phoneError}
                                helperText={phoneError}
                                placeholder="912345678"
                            />
                            <TextField
                                label="Motivo da consulta"
                                fullWidth
                                multiline
                                rows={4}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />

                            <FormControl
                                fullWidth
                                variant="outlined"
                                sx={{
                                    maxWidth: 800,
                                    mt: 2
                                }}
                            >
                                <InputLabel id="tipo-consulta-label">
                                    Tipo de Consulta
                                </InputLabel>

                                <Select
                                    labelId="tipo-consulta-label"
                                    id="tipo-consulta"
                                    value={tipoConsulta}
                                    label="Tipo de Consulta"
                                    onChange={(e) => setTipoConsulta(e.target.value)}
                                    required
                                    sx={{
                                        borderRadius: 3,
                                        backgroundColor: "#fafafa",
                                        "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "#ddd",
                                        },
                                        "&:hover .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "#999",
                                        },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "#2e7d32",
                                        },
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>Selecionar...</em>
                                    </MenuItem>

                                    <MenuItem value="Consulta de nutrição avulso - 60€">
                                        Consulta de nutrição avulso — <strong>60€</strong>
                                    </MenuItem>

                                    <MenuItem value="Pack de 4 consultas de nutrição - 220€">
                                        Pack de 4 consultas — <strong>220€</strong>
                                    </MenuItem>
                                </Select>
                            </FormControl>
                            <FormControlLabel required control={<Checkbox />} onChange={handleChange} label="Declaro para os efeitos previstos no disposto no artigo 13º do Regulamento Geral da Proteção de Dados (EU) 2016/679 do P.E. e do Conselho de 27 de Abril (RGPD) prestar o meu consentimento para recolha, utilização, registo e tratamento dos meus dados pessoais à Nutricionista Teresa Pereira Soares CP 6107N" />

                        </Stack>
                    </Paper>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setStep(1)}
                            sx={{ flex: 1, py: 1.5, borderRadius: 2 }}
                        >
                            Voltar
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            sx={{ flex: 1, py: 1.5, borderRadius: 2, fontWeight: 700 }}
                        >
                            {submitting ? <CircularProgress size={24} color="inherit" /> : "Confirmar"}
                        </Button>
                    </Stack>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#EFEFEF" }}>
            {renderNavbar(false)}
            <Container maxWidth="sm" sx={{ py: 6, textAlign: "center" }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 80, color: "#4caf50", mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    Consulta Agendada com Sucesso!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    A sua consulta será confirmada pela nutricionista. Assim que estiver validada, receberá um e-mail de confirmação.
                </Typography>

                <Paper sx={{ p: 3, textAlign: "left" }}>
                    <Stack spacing={1.5}>
                        <Typography>
                            <strong>Data:</strong> {selectedDate?.format("DD/MM/YYYY")}
                        </Typography>
                        <Typography>
                            <strong>Hora:</strong> {selectedTime}
                        </Typography>
                        <Typography>
                            <strong>Nome:</strong> {name}
                        </Typography>
                    </Stack>
                </Paper>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => router.push("/")}
                    sx={{ mt: 4, py: 1.5, fontWeight: 700, borderRadius: 2 }}
                >
                    Voltar ao início
                </Button>
            </Container>
        </Box>
    );
}
