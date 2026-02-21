"use client";

import * as React from "react";
import {
    Box,
    Button,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    Paper,
    IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import Tooltip from "@mui/material/Tooltip";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase-config";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, getDoc, setDoc } from "firebase/firestore";
import { decryptData } from "../utils/encryption";
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { LocalizationProvider } from "@mui/x-date-pickers";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");
import emailjs from "@emailjs/browser";
import { Alert, Snackbar } from "@mui/material";

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const EMAILJS_CONFIRM_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_CONFIRM_TEMPLATE_ID || "";
const EMAILJS_CANCEL_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_CANCEL_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";


const TIME_SLOTS = [
    "09:00", "10:00", "11:00", "12:00",
    "14:00", "15:00", "16:00", "17:00", "18:00",
];

const WEEKDAY_HEADERS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function getMonthDays(year, month) {
    const first = dayjs().year(year).month(month).startOf("month");
    const daysInMonth = first.daysInMonth();
    const startDow = (first.day() + 6) % 7; // Mon=0..Sun=6
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

const STATUS_CONFIG = {
    pending: { label: "Pendente", color: "warning" },
    confirmed: { label: "Confirmada", color: "success" },
    cancelled: { label: "Cancelada", color: "error" },
};

export default function ClientsPage({ onSelectClient, onNewClient, onNewClientFromBooking, onAvailability }) {
    const [clients, setClients] = React.useState([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [estab, setEstab] = React.useState("any");
    const [loading, setLoading] = React.useState(false);

    const [bookings, setBookings] = React.useState([]);
    const [rescheduleDialog, setRescheduleDialog] = React.useState({ open: false, booking: null });
    const [rescheduleDate, setRescheduleDate] = React.useState(null);
    const [rescheduleTime, setRescheduleTime] = React.useState("");
    const [snackbar, setSnackbar] = React.useState({ open: false, message: "", severity: "success" });

    const [calViewYear, setCalViewYear] = React.useState(dayjs().year());
    const [calViewMonth, setCalViewMonth] = React.useState(dayjs().month());
    const [calSelectedDate, setCalSelectedDate] = React.useState(null);

    const hasSyncedSlots = React.useRef(false);

    React.useEffect(() => {
        fetchClients();
        fetchBookings();
    }, []);

    React.useEffect(() => {
        if (hasSyncedSlots.current || bookings.length === 0) return;
        hasSyncedSlots.current = true;
        const syncConfirmedSlots = async () => {
            const confirmed = bookings.filter((b) => b.status === "confirmed" && b.date && b.time);
            const byMonth = {};
            for (const b of confirmed) {
                const monthKey = dayjs(b.date).format("YYYY-MM");
                if (!byMonth[monthKey]) byMonth[monthKey] = [];
                byMonth[monthKey].push(b);
            }
            for (const [monthKey, monthBookings] of Object.entries(byMonth)) {
                try {
                    const docRef = doc(db, "settings", monthKey);
                    const snap = await getDoc(docRef);
                    if (!snap.exists()) continue;
                    const data = { ...snap.data() };
                    let changed = false;
                    for (const b of monthBookings) {
                        const dateSlots = data[b.date];
                        if (!Array.isArray(dateSlots)) continue;
                        const [h, m] = b.time.split(":").map(Number);
                        const totalMin = h * 60 + m + 30;
                        const nextSlot = `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
                        const slotsToRemove = new Set([b.time, nextSlot]);
                        const updated = dateSlots.filter((s) => !slotsToRemove.has(s));
                        if (updated.length !== dateSlots.length) {
                            data[b.date] = updated;
                            changed = true;
                        }
                    }
                    if (changed) {
                        await setDoc(docRef, data);
                        console.log(`Synced availability for ${monthKey}`);
                    }
                } catch (err) {
                    console.error("Error syncing slots for", monthKey, err);
                }
            }
        };
        syncConfirmedSlots();
    }, [bookings]);

    const fetchClients = async () => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) return;
            const clientsRef = collection(db, "users", userId, "clients");
            const q = query(clientsRef, orderBy("name"));
            const snapshot = await getDocs(q);
            const clientList = await Promise.all(
                snapshot.docs.map(async (d) => {
                    const raw = { id: d.id, ...d.data() };
                    if (raw.encryptedData && raw.iv) {
                        try {
                            const decrypted = await decryptData(
                                { encryptedData: raw.encryptedData, iv: raw.iv },
                                userId
                            );
                            return { ...raw, email: decrypted.email || "", phone: decrypted.phone || "" };
                        } catch (e) {
                            console.warn("Could not decrypt client for list:", raw.id, e);
                        }
                    }
                    return raw;
                })
            );
            setClients(clientList);
        } catch (error) {
            console.error("Error fetching clients:", error);
        }
    };

    const fetchBookings = async () => {
        try {
            const bookingsRef = collection(db, "bookings");
            const q = query(bookingsRef, orderBy("date"));
            const snapshot = await getDocs(q);
            setBookings(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Error fetching bookings:", error);
        }
    };

    const sendBookingEmail = async (booking, templateId) => {
        if (!EMAILJS_SERVICE_ID || !templateId || !EMAILJS_PUBLIC_KEY) {
            console.warn("EmailJS: missing config", { EMAILJS_SERVICE_ID, templateId, EMAILJS_PUBLIC_KEY: !!EMAILJS_PUBLIC_KEY });
            return;
        }
        if (!booking.email) return;
        console.log("BOOKING", booking)
        try {
            const formattedDate = booking.date ? dayjs(booking.date).format("DD/MM/YYYY") : "-";
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                templateId,
                {
                    to_email: booking.email,
                    to_name: booking.name || "",
                    date: formattedDate,
                    time: booking.time || "",
                },
                { publicKey: EMAILJS_PUBLIC_KEY }
            );
            setSnackbar({ open: true, message: `Email enviado para ${booking.email}`, severity: "success" });
        } catch (err) {
            console.error("EmailJS error:", err);
            setSnackbar({ open: true, message: "Erro ao enviar email.", severity: "error" });
        }
    };

    const removeSlotFromAvailability = async (date, time) => {
        if (!date || !time) return;
        try {
            const [h, m] = time.split(":").map(Number);
            const totalMin = h * 60 + m + 30;
            const nextSlot = `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;

            const monthKey = dayjs(date).format("YYYY-MM");
            const docRef = doc(db, "settings", monthKey);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return;
            const data = snap.data();
            const dateSlots = data[date];
            if (!Array.isArray(dateSlots)) return;
            const slotsToRemove = new Set([time, nextSlot]);
            const updated = dateSlots.filter((s) => !slotsToRemove.has(s));
            await setDoc(docRef, { ...data, [date]: updated });
        } catch (err) {
            console.error("Error removing slot from availability:", err);
        }
    };

    const handleConfirmBooking = async (bookingId) => {
        try {
            await updateDoc(doc(db, "bookings", bookingId), { status: "confirmed" });
            const updated = bookings.find((b) => b.id === bookingId);
            setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status: "confirmed" } : b))
            );
            if (updated) {
                removeSlotFromAvailability(updated.date, updated.time);
                sendBookingEmail(updated, EMAILJS_CONFIRM_TEMPLATE_ID);
            }
        } catch (error) {
            console.error("Error confirming booking:", error);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        try {
            await updateDoc(doc(db, "bookings", bookingId), { status: "cancelled" });
            const updated = bookings.find((b) => b.id === bookingId);
            setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
            );
            if (updated) sendBookingEmail(updated, EMAILJS_CANCEL_TEMPLATE_ID);
        } catch (error) {
            console.error("Error cancelling booking:", error);
        }
    };

    const handleOpenReschedule = (booking) => {
        setRescheduleDate(booking.date ? dayjs(booking.date) : null);
        setRescheduleTime(booking.time || "");
        setRescheduleDialog({ open: true, booking });
    };

    const handleSaveReschedule = async () => {
        const booking = rescheduleDialog.booking;
        if (!booking || !rescheduleDate || !rescheduleTime) return;
        try {
            const newDate = rescheduleDate.format("YYYY-MM-DD");
            await updateDoc(doc(db, "bookings", booking.id), {
                date: newDate,
                time: rescheduleTime,
                status: "pending",
            });
            setBookings((prev) =>
                prev.map((b) =>
                    b.id === booking.id
                        ? { ...b, date: newDate, time: rescheduleTime, status: "pending" }
                        : b
                )
            );
            sendBookingEmail(
                { ...booking, date: newDate, time: rescheduleTime },
                EMAILJS_CONFIRM_TEMPLATE_ID,
            );
            setRescheduleDialog({ open: false, booking: null });
        } catch (error) {
            console.error("Error rescheduling booking:", error);
        }
    };

    const handleDeleteBooking = async (bookingId) => {
        if (!window.confirm("Tem a certeza que deseja eliminar este pedido?")) return;
        try {
            await deleteDoc(doc(db, "bookings", bookingId));
            setBookings((prev) => prev.filter((b) => b.id !== bookingId));
        } catch (error) {
            console.error("Error deleting booking:", error);
        }
    };

    const activeBookings = React.useMemo(
        () => bookings
            .filter((b) => b.status !== "cancelled")
            .sort((a, b) => {
                const dateA = a.date || "";
                const dateB = b.date || "";
                if (dateA !== dateB) return dateA.localeCompare(dateB);
                return (a.time || "").localeCompare(b.time || "");
            }),
        [bookings]
    );

    const confirmedByDate = React.useMemo(() => {
        const map = {};
        bookings
            .filter((b) => b.status === "confirmed")
            .forEach((b) => {
                if (!b.date) return;
                if (!map[b.date]) map[b.date] = [];
                map[b.date].push(b);
            });
        // Sort each day's bookings by time
        for (const key of Object.keys(map)) {
            map[key].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
        }
        return map;
    }, [bookings]);

    const calMonthDays = React.useMemo(
        () => getMonthDays(calViewYear, calViewMonth),
        [calViewYear, calViewMonth]
    );

    const calSelectedBookings = React.useMemo(
        () => (calSelectedDate ? confirmedByDate[calSelectedDate] || [] : []),
        [calSelectedDate, confirmedByDate]
    );

    const calGoNext = () => {
        if (calViewMonth === 11) {
            setCalViewMonth(0);
            setCalViewYear((y) => y + 1);
        } else {
            setCalViewMonth((m) => m + 1);
        }
    };

    const calGoPrev = () => {
        if (calViewMonth === 0) {
            setCalViewMonth(11);
            setCalViewYear((y) => y - 1);
        } else {
            setCalViewMonth((m) => m - 1);
        }
    };

    const confirmedCountThisMonth = React.useMemo(() => {
        return calMonthDays.filter((d) => d && confirmedByDate[d]).length;
    }, [calMonthDays, confirmedByDate]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const handleCopyBookingLink = () => {
        const url = `${window.location.origin}/agendar`;
        navigator.clipboard.writeText(url);
        setSnackbar({ open: true, message: "Link de marcação copiado!", severity: "success" });
    };

    const handleOpenClientFromBooking = async (booking) => {
        const bookingEmail = (booking.email || "").trim().toLowerCase();
        if (!bookingEmail) return;
        const match = clients.find(
            (c) => (c.email || "").trim().toLowerCase() === bookingEmail
        );
        if (match) {
            handleSelectClient(match);
        } else {
            if (onNewClientFromBooking) {
                onNewClientFromBooking({
                    name: booking.name || "",
                    email: booking.email || "",
                    phone: booking.phone || "",
                });
            }
        }
    };

    const handleSelectClient = async (clientDoc) => {
        try {
            setLoading(true);
            const userId = auth.currentUser?.uid;
            if (!userId) return;

            if (clientDoc.encryptedData && clientDoc.iv) {
                const decrypted = await decryptData(
                    { encryptedData: clientDoc.encryptedData, iv: clientDoc.iv },
                    userId
                );

                const clientDocRef = doc(db, "users", userId, "clients", clientDoc.id);
                const fileDocs = await getDocs(collection(clientDocRef, "files"));
                const fileDataMap = {};
                for (const fileDoc of fileDocs.docs) {
                    try {
                        const fileDecrypted = await decryptData(
                            { encryptedData: fileDoc.data().encryptedData, iv: fileDoc.data().iv },
                            userId
                        );
                        fileDataMap[fileDoc.id] = fileDecrypted.data;
                    } catch (e) {
                        console.warn("Could not decrypt file:", fileDoc.id, e);
                    }
                }

                if (decrypted.items) {
                    decrypted.items = decrypted.items.map((item) => ({
                        ...item,
                        files: (item.files || []).map((f) => ({
                            ...f,
                            data: fileDataMap[f.id] || null,
                        })),
                    }));
                }

                onSelectClient({ id: clientDoc.id, ...decrypted });
            } else {
                onSelectClient(clientDoc);
            }
        } catch (error) {
            console.error("Error decrypting client:", error);
            onSelectClient(clientDoc);
        } finally {
            setLoading(false);
        }
    };

    const filtered = React.useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return clients.filter((c) => (q ? c.name?.toLowerCase().includes(q) : true));
    }, [clients, searchQuery]);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#EFEFEF" }}>
            {/* Top bar */}
            <Box className="navbarTop" sx={{ color: "white", px: 3, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    NutriBase
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip title="Copiar link de marcação">
                        <IconButton size="small" sx={{ color: "white" }} onClick={handleCopyBookingLink}>
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Disponibilidade">
                        <IconButton size="small" sx={{ color: "white" }} onClick={onAvailability}>
                            <AccessTimeIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Teresa Pereira Soares {<StarBorderIcon />}
                    </Typography>
                    <IconButton size="small" sx={{ color: "white" }} onClick={handleLogout} title="Logout">
                        <LogoutIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Box>

            <Container maxWidth={false} sx={{ py: 4 }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                    <Box>
                        <Typography variant="h2" sx={{ fontWeight: 900 }} color="text.primary">
                            Clientes
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Consulte os dados dos seus clientes
                        </Typography>
                    </Box>

                    <Button sx={{ backgroundColor: "#764248" }} variant="contained" startIcon={<AddIcon />} onClick={onNewClient}>
                        Novo Cliente
                    </Button>
                </Stack>

                {/* Filters row */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 3 }}>


                    <Box sx={{ flex: 1 }} />

                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {filtered.length} Resultados
                    </Typography>

                    <Box sx={{ flex: 1 }} />

                    <TextField
                        size="small"
                        placeholder="Pesquisar clientes"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            endAdornment: <SearchIcon fontSize="small" />,
                        }}
                        sx={{ width: 420 }}
                    />
                </Stack>

                {/* Table */}
                <Paper sx={{ mt: 2, overflow: "hidden" }}>
                    {/* Header row */}
                    <Box
                        className="navbar"
                        sx={{
                            px: 2,
                            py: 1.25,
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 80px 140px",
                            alignItems: "center",
                            color: "primary.contrastText",
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Nome
                        </Typography>

                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            Email
                        </Typography>

                        <Typography variant="subtitle2" sx={{ fontWeight: 700, textAlign: "center" }}>
                            Idade
                        </Typography>

                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Última consulta
                            </Typography>
                            <ArrowDownwardIcon fontSize="small" />
                        </Stack>
                    </Box>

                    {/* Body */}
                    {filtered.length === 0 ? (
                        <EmptyState onNewClient={onNewClient} />
                    ) : (
                        <Box>
                            {filtered.map((c) => (
                                <Box
                                    key={c.id}
                                    onClick={() => handleSelectClient(c)}
                                    sx={{
                                        cursor: "pointer",
                                        px: 2,
                                        py: 1.5,
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr 80px 140px",
                                        alignItems: "center",
                                        borderTop: "1px solid",
                                        borderColor: "divider",
                                        "&:hover": { bgcolor: "action.hover" },
                                    }}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {c.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {c.email || "-"}
                                    </Typography>
                                    <Typography variant="body2" sx={{ textAlign: "center" }}>
                                        {c.age ?? "-"}
                                    </Typography>
                                    <Typography variant="body2" sx={{ textAlign: "right" }}>
                                        {c.lastVisit ?? "-"}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Paper>

                {/* ── Consultas Pedidas ─────────────────────────────────── */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 5, mb: 2 }}>
                    <EventNoteIcon color="primary" />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Consultas Pedidas
                    </Typography>
                    <Chip label={activeBookings.length} size="small" color="primary" />
                </Stack>

                <Paper sx={{ overflow: "hidden" }}>
                    {/* Header */}
                    <Box
                        className="navbar"
                        sx={{
                            px: 2,
                            py: 1.25,
                            display: "grid",
                            gridTemplateColumns: "1fr 40px 1fr 100px 100px 160px",
                            alignItems: "center",
                            color: "primary.contrastText",
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Nome</Typography>
                        <Box />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Contacto</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, textAlign: "center" }}>Data</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, textAlign: "center" }}>Hora</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, textAlign: "right" }}>Ações</Typography>
                    </Box>

                    {/* Body */}
                    {activeBookings.length === 0 ? (
                        <Box sx={{ py: 4, textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                                Sem pedidos de consulta de momento.
                            </Typography>
                        </Box>
                    ) : (
                        <Box>
                            {activeBookings.map((b) => {
                                const status = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                                const formattedDate = b.date ? dayjs(b.date).format("DD/MM/YYYY") : "-";
                                return (
                                    <Box
                                        key={b.id}
                                        sx={{
                                            px: 2,
                                            py: 1.5,
                                            display: "grid",
                                            gridTemplateColumns: "1fr 40px 1fr 100px 100px 160px",
                                            alignItems: "center",
                                            borderTop: "1px solid",
                                            borderColor: "divider",
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {b.name || "-"}
                                            </Typography>
                                            {b.reason && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {b.reason}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Tooltip title={
                                            clients.some((c) => (c.email || "").trim().toLowerCase() === (b.email || "").trim().toLowerCase())
                                                ? "Abrir ficha do cliente"
                                                : "Criar novo cliente"
                                        }>
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleOpenClientFromBooking(b)}
                                            >
                                                <PersonSearchIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Box>
                                            <Typography variant="body2">{b.email || "-"}</Typography>
                                            <Typography variant="caption" color="text.secondary">{b.phone || ""}</Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ textAlign: "center" }}>
                                            {formattedDate}
                                        </Typography>
                                        <Typography variant="body2" sx={{ textAlign: "center" }}>
                                            {b.time || "-"}
                                        </Typography>
                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                            <Chip
                                                label={status.label}
                                                color={status.color}
                                                size="small"
                                                variant="outlined"
                                                sx={{ minWidth: 80 }}
                                            />
                                            {b.status !== "confirmed" && (
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    title="Confirmar"
                                                    onClick={() => handleConfirmBooking(b.id)}
                                                >
                                                    <CheckCircleIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                title="Reagendar"
                                                onClick={() => handleOpenReschedule(b)}
                                            >
                                                <EditCalendarIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                title="Cancelar"
                                                onClick={() => handleCancelBooking(b.id)}
                                            >
                                                <CancelIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Paper>

                {/* ── Confirmed Appointments Calendar ─────────────────── */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 5, mb: 2 }}>
                    <CalendarMonthIcon color="primary" />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Agenda de Consultas
                    </Typography>
                    <Chip label={Object.values(confirmedByDate).flat().length} size="small" color="secondary" />
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={3}>


                    {/* Appointments for selected day */}
                    <Paper sx={{ p: 3, flex: 1 }}>
                        {!calSelectedDate ? (
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
                                <Typography variant="body1" color="text.secondary">
                                    Selecione um dia no calendário para ver as consultas confirmadas
                                </Typography>
                            </Box>
                        ) : calSelectedBookings.length === 0 ? (
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
                                <Typography variant="body1" color="text.secondary">
                                    Sem consultas confirmadas para {dayjs(calSelectedDate).format("DD/MM/YYYY")}
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                    {dayjs(calSelectedDate).format("DD [de] MMMM [de] YYYY")}
                                </Typography>
                                <Stack spacing={1.5}>
                                    {calSelectedBookings.map((b) => (
                                        <Paper
                                            key={b.id}
                                            variant="outlined"
                                            sx={{ p: 2, borderLeft: "4px solid #4caf50" }}
                                        >
                                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                        {b.time || "-"} — {b.name || "Sem nome"}
                                                    </Typography>
                                                    {b.email && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {b.email}
                                                        </Typography>
                                                    )}
                                                    {b.phone && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                            • {b.phone}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Chip label="Confirmada" color="success" size="small" />
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>
                            </>
                        )}
                    </Paper>
                    {/* Calendar */}
                    <Paper sx={{ p: 3, flex: "0 0 auto", width: { xs: "100%", md: 380 } }}>
                        {/* Month navigation */}
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                            <IconButton size="small" onClick={calGoPrev}>
                                <ArrowBackIosNewIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="h6" sx={{ fontWeight: 700, textTransform: "capitalize" }}>
                                {formatMonthLabel(calViewYear, calViewMonth)}
                            </Typography>
                            <IconButton size="small" onClick={calGoNext}>
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
                            {calMonthDays.map((dateKey, idx) => {
                                if (!dateKey) return <Box key={`empty-${idx}`} />;
                                const day = dayjs(dateKey).date();
                                const isSelected = calSelectedDate === dateKey;
                                const hasAppt = !!confirmedByDate[dateKey];
                                const apptCount = hasAppt ? confirmedByDate[dateKey].length : 0;
                                const isToday = dateKey === dayjs().format("YYYY-MM-DD");
                                return (
                                    <Box
                                        key={dateKey}
                                        onClick={() => setCalSelectedDate(dateKey)}
                                        sx={{
                                            aspectRatio: "1",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderRadius: 1.5,
                                            cursor: "pointer",
                                            position: "relative",
                                            bgcolor: isSelected ? "#764248" : isToday ? "action.selected" : "transparent",
                                            color: isSelected ? "white" : "text.primary",
                                            fontWeight: isSelected || isToday ? 700 : 400,
                                            fontSize: "0.85rem",
                                            border: hasAppt && !isSelected ? "2px solid #CACEB7" : "2px solid transparent",
                                            "&:hover": {
                                                bgcolor: isSelected ? "#5a3238" : "action.hover",
                                            },
                                        }}
                                    >
                                        {day}
                                        {hasAppt && (
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    bottom: 2,
                                                    width: 5,
                                                    height: 5,
                                                    borderRadius: "50%",
                                                    bgcolor: isSelected ? "white" : "#CACEB7",
                                                }}
                                            />
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                            {confirmedCountThisMonth} dia{confirmedCountThisMonth !== 1 ? "s" : ""} com consultas confirmadas
                        </Typography>
                    </Paper>
                </Stack>

                {/* ── Reschedule Dialog ────────────────────────────────── */}
                <Dialog
                    open={rescheduleDialog.open}
                    onClose={() => setRescheduleDialog({ open: false, booking: null })}
                    maxWidth="xs"
                    fullWidth
                >
                    <DialogTitle sx={{ fontWeight: 700 }}>Reagendar Consulta</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {rescheduleDialog.booking?.name}
                        </Typography>
                        <Paper variant="outlined" sx={{ overflow: "hidden", mb: 2 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                                <DateCalendar
                                    value={rescheduleDate}
                                    onChange={(val) => setRescheduleDate(val)}
                                    minDate={dayjs()}
                                />
                            </LocalizationProvider>
                        </Paper>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Horário
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                            {TIME_SLOTS.map((t) => (
                                <Button
                                    key={t}
                                    size="small"
                                    variant={rescheduleTime === t ? "contained" : "outlined"}
                                    onClick={() => setRescheduleTime(t)}
                                >
                                    {t}
                                </Button>
                            ))}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setRescheduleDialog({ open: false, booking: null })}>
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            disabled={!rescheduleDate || !rescheduleTime}
                            onClick={handleSaveReschedule}
                        >
                            Guardar
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
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

function EmptyState({ onNewClient }) {
    return (
        <Box sx={{ py: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Stack spacing={2} alignItems="center">
                <Box
                    sx={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        bgcolor: "action.selected",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <HelpOutlineIcon />
                </Box>

                <Typography variant="body2" color="text.secondary">
                    Comece por adicionar um novo Cliente
                </Typography>

                <Button variant="contained" startIcon={<AddIcon />} onClick={onNewClient}>
                    Novo Cliente
                </Button>
            </Stack>
        </Box>
    );
}
