"use client";

import * as React from "react";
import {
    Box,
    Button,
    Container,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    Alert,
    Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import BarChartIcon from "@mui/icons-material/BarChart";
import TableChartIcon from "@mui/icons-material/TableChart";
import PrintIcon from "@mui/icons-material/Print";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase-config";
import { doc, setDoc, deleteDoc, collection, getDocs, writeBatch } from "firebase/firestore";
import { encryptData } from "../utils/encryption";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import StarBorderIcon from '@mui/icons-material/StarBorder';


const CHART_GROUPS = [
    {
        title: "Altura / Peso / IMC",
        fields: [
            { key: "height", label: "Altura (cm)", color: "#1976d2" },
            { key: "weight", label: "Peso (kg)", color: "#2e7d32" },
            { key: "bmi", label: "IMC", color: "#ed6c02" },
        ],
    },
    {
        title: "Composição Corporal",
        fields: [
            { key: "bodyFat", label: "% Gordura", color: "#d32f2f" },
            { key: "muscleMass", label: "Massa Musc. (kg)", color: "#1976d2" },
            { key: "visceralFat", label: "Gordura Visceral", color: "#ed6c02" },
            { key: "water", label: "% Água", color: "#0288d1" },
        ],
    },
    {
        title: "Pregas Cutâneas",
        fields: [
            { key: "tricep", label: "Tricipital", color: "#d32f2f" },
            { key: "subscapular", label: "Subescapular", color: "#1976d2" },
            { key: "suprailiac", label: "Suprailíaca", color: "#2e7d32" },
            { key: "abdominalFold", label: "Abdominal", color: "#ed6c02" },
            { key: "thighFold", label: "Crural", color: "#9c27b0" },
            { key: "calfFold", label: "Geminal", color: "#0288d1" },
        ],
    },
    {
        title: "Perímetros",
        fields: [
            { key: "waist", label: "Cintura", color: "#d32f2f" },
            { key: "hip", label: "Anca", color: "#1976d2" },
            { key: "chest", label: "Peito", color: "#2e7d32" },
            { key: "arm", label: "Braço", color: "#ed6c02" },
            { key: "thigh", label: "Coxa", color: "#9c27b0" },
            { key: "calf", label: "Gémeo", color: "#0288d1" },
        ],
    },
];

const ALL_TABLE_FIELDS = [
    { key: "weight", label: "Peso (kg)" },
    { key: "height", label: "Altura (cm)" },
    { key: "bmi", label: "IMC", disabled: true },
    { key: "bodyFat", label: "% Gordura" },
    { key: "muscleMass", label: "M. Musc. (kg)" },
    { key: "visceralFat", label: "G. Visceral" },
    { key: "water", label: "% Água" },
    { key: "tricep", label: "P. Tricipital" },
    { key: "subscapular", label: "P. Subescapular" },
    { key: "suprailiac", label: "P. Suprailíaca" },
    { key: "abdominalFold", label: "P. Abdominal" },
    { key: "thighFold", label: "P. Crural" },
    { key: "calfFold", label: "P. Geminal" },
    { key: "waist", label: "Cintura (cm)" },
    { key: "hip", label: "Anca (cm)" },
    { key: "chest", label: "Peito (cm)" },
    { key: "arm", label: "Braço (cm)" },
    { key: "thigh", label: "Coxa (cm)" },
    { key: "calf", label: "Gémeo (cm)" },
];

const EMPTY_ROW = {
    date: "", weight: "", height: "", bmi: "",
    bodyFat: "", muscleMass: "", visceralFat: "", water: "",
    tricep: "", subscapular: "", suprailiac: "", abdominalFold: "", thighFold: "", calfFold: "",
    waist: "", hip: "", chest: "", arm: "", thigh: "", calf: "",
};

function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return "";
    const today = new Date();
    const birth = new Date(dateOfBirth);
    if (isNaN(birth.getTime())) return "";
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age >= 0 ? String(age) : "";
}

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

export default function ClientDetail({ client, onBack, isNew }) {
    const [form, setForm] = React.useState({
        name: "", age: "", dateOfBirth: "", gender: "",
        phone: "", email: "", address: "", occupation: "",
        motivo: "",
        ...client,
    });

    const [historyTab, setHistoryTab] = React.useState(0);
    const [personalHistory, setPersonalHistory] = React.useState(client?.personalHistory || "");
    const [clinicalHistory, setClinicalHistory] = React.useState(client?.clinicalHistory || "");
    const [alimentarHistory, setAlimentarHistory] = React.useState(client?.alimentarHistory || "");

    const [anthropometricData, setAnthropometricData] = React.useState(client?.anthropometricData || []);
    const [anthroView, setAnthroView] = React.useState("charts");

    const [items, setItems] = React.useState(client?.items || []);

    const [energyNeeds, setEnergyNeeds] = React.useState(client?.energyNeeds || {
        basalMetabolism: "", activityFactor: "", totalEnergy: "",
    });
    const [hydrationNeeds, setHydrationNeeds] = React.useState(client?.hydrationNeeds || {
        weightBased: "", total: "",
    });
    const [macroDistribution, setMacroDistribution] = React.useState(client?.macroDistribution || {
        proteinPct: "", proteinGrams: "", proteinKcal: "",
        carbsPct: "", carbsGrams: "", carbsKcal: "",
        fatPct: "", fatGrams: "", fatKcal: "",
    });

    const [saving, setSaving] = React.useState(false);
    const [snackbar, setSnackbar] = React.useState({ open: false, message: "", severity: "success" });

    const phoneError = validatePhone(form.phone);
    const emailError = validateEmail(form.email);

    React.useEffect(() => {
        const age = calculateAge(form.dateOfBirth);
        if (age && age !== form.age) {
            setForm((prev) => ({ ...prev, age }));
        }
    }, [form.dateOfBirth]);

    React.useEffect(() => {
        const totalE = parseFloat(energyNeeds.totalEnergy);
        if (!isNaN(totalE) && totalE > 0) {
            setMacroDistribution((prev) => {
                const updated = { ...prev };
                const pPct = parseFloat(prev.proteinPct);
                if (!isNaN(pPct)) {
                    updated.proteinKcal = String(Math.round(totalE * pPct / 100));
                    updated.proteinGrams = String(Math.round(totalE * pPct / 100 / 4));
                }
                const cPct = parseFloat(prev.carbsPct);
                if (!isNaN(cPct)) {
                    updated.carbsKcal = String(Math.round(totalE * cPct / 100));
                    updated.carbsGrams = String(Math.round(totalE * cPct / 100 / 4));
                }
                const fPct = parseFloat(prev.fatPct);
                if (!isNaN(fPct)) {
                    updated.fatKcal = String(Math.round(totalE * fPct / 100));
                    updated.fatGrams = String(Math.round(totalE * fPct / 100 / 9));
                }
                return updated;
            });
        }
    }, [energyNeeds.totalEnergy, macroDistribution.proteinPct, macroDistribution.carbsPct, macroDistribution.fatPct]);

    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleLogout = async () => {
        try { await signOut(auth); } catch (err) { console.error(err); }
    };

    const handleSave = async () => {
        if (phoneError || emailError) {
            setSnackbar({ open: true, message: "Corrija os erros antes de guardar.", severity: "error" });
            return;
        }

        setSaving(true);
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                setSnackbar({ open: true, message: "Utilizador não autenticado.", severity: "error" });
                return;
            }

            const clientId = client?.id || crypto.randomUUID();
            const clientDocRef = doc(db, "users", userId, "clients", clientId);
            const filesColRef = collection(clientDocRef, "files");

            const allFiles = [];
            const itemsWithoutData = items.map((item) => {
                const fileMeta = (item.files || []).map((f) => {
                    allFiles.push({ ...f, itemId: item.id });
                    return { id: f.id, name: f.name, size: f.size, type: f.type };
                });
                return { ...item, files: fileMeta };
            });

            const clientData = {
                ...form,
                personalHistory,
                clinicalHistory,
                alimentarHistory,
                anthropometricData,
                items: itemsWithoutData,
                energyNeeds,
                hydrationNeeds,
                macroDistribution,
                lastVisit: new Date().toISOString().split("T")[0],
            };

            const encrypted = await encryptData(clientData, userId);

            await setDoc(clientDocRef, {
                name: form.name || "",
                age: form.age || "",
                lastVisit: clientData.lastVisit,
                encryptedData: encrypted.encryptedData,
                iv: encrypted.iv,
            });

            const oldFileDocs = await getDocs(filesColRef);
            const batch = writeBatch(db);
            oldFileDocs.forEach((d) => batch.delete(d.ref));
            for (const file of allFiles) {
                const fileEncrypted = await encryptData({ data: file.data }, userId);
                batch.set(doc(filesColRef, file.id), {
                    itemId: file.itemId,
                    encryptedData: fileEncrypted.encryptedData,
                    iv: fileEncrypted.iv,
                });
            }
            await batch.commit();

            setSnackbar({ open: true, message: "Cliente guardado com sucesso!", severity: "success" });
            setTimeout(() => onBack(), 800);
        } catch (error) {
            console.error("Error saving client:", error);
            setSnackbar({ open: true, message: "Erro ao guardar: " + error.message, severity: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!client?.id) return;
        if (!window.confirm("Tem a certeza que deseja eliminar este cliente?")) return;
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) return;
            const clientDocRef = doc(db, "users", userId, "clients", client.id);
            const fileDocs = await getDocs(collection(clientDocRef, "files"));
            const batch = writeBatch(db);
            fileDocs.forEach((d) => batch.delete(d.ref));
            batch.delete(clientDocRef);
            await batch.commit();
            onBack();
        } catch (error) {
            console.error("Error deleting client:", error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const addAnthropometricRow = () => {
        setAnthropometricData((prev) => [
            ...prev,
            { id: crypto.randomUUID(), date: new Date().toISOString().split("T")[0], ...EMPTY_ROW },
        ]);
    };

    const updateAnthropometricRow = (id, field, value) => {
        setAnthropometricData((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;
                const updated = { ...row, [field]: value };
                if ((field === "weight" || field === "height") && updated.weight && updated.height) {
                    const h = parseFloat(updated.height) / 100;
                    if (h > 0) updated.bmi = (parseFloat(updated.weight) / (h * h)).toFixed(1);
                }
                return updated;
            })
        );
    };

    const removeAnthropometricRow = (id) => {
        setAnthropometricData((prev) => prev.filter((row) => row.id !== id));
    };

    const [uploading, setUploading] = React.useState({});
    const MAX_FILE_SIZE = 700 * 1024;

    const addItem = () => {
        setItems((prev) => [...prev, { id: crypto.randomUUID(), text: "", files: [] }]);
    };
    const updateItem = (id, text) => {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, text } : it)));
    };
    const removeItem = (id) => {
        setItems((prev) => prev.filter((it) => it.id !== id));
    };

    const fileToBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const handleFileUpload = async (itemId, fileList) => {
        if (!fileList?.length) return;
        setUploading((prev) => ({ ...prev, [itemId]: true }));

        try {
            const newFiles = [];
            for (const file of Array.from(fileList)) {
                if (file.size > MAX_FILE_SIZE) {
                    setSnackbar({ open: true, message: `"${file.name}" excede 700KB. Use ficheiros mais pequenos.`, severity: "warning" });
                    continue;
                }
                const base64 = await fileToBase64(file);
                newFiles.push({
                    id: crypto.randomUUID(),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    data: base64,
                });
            }
            if (newFiles.length) {
                setItems((prev) =>
                    prev.map((it) =>
                        it.id === itemId
                            ? { ...it, files: [...(it.files || []), ...newFiles] }
                            : it
                    )
                );
            }
        } catch (error) {
            console.error("Error reading file:", error);
            setSnackbar({ open: true, message: "Erro ao ler ficheiro: " + error.message, severity: "error" });
        } finally {
            setUploading((prev) => ({ ...prev, [itemId]: false }));
        }
    };

    const removeFile = (itemId, fileId) => {
        setItems((prev) =>
            prev.map((it) =>
                it.id === itemId
                    ? { ...it, files: (it.files || []).filter((f) => f.id !== fileId) }
                    : it
            )
        );
    };

    const downloadFile = (file) => {
        const link = document.createElement("a");
        link.href = file.data;
        link.download = file.name;
        link.click();
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return "";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const chartData = React.useMemo(
        () =>
            [...anthropometricData]
                .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
                .map((row) => {
                    const point = { date: row.date };
                    ALL_TABLE_FIELDS.forEach(({ key }) => {
                        const v = parseFloat(row[key]);
                        if (!isNaN(v)) point[key] = v;
                    });
                    return point;
                }),
        [anthropometricData]
    );

    const historyValue = [personalHistory, clinicalHistory, alimentarHistory][historyTab];
    const historySetters = [setPersonalHistory, setClinicalHistory, setAlimentarHistory];

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#EFEFEF" }}>
            {/* Top bar */}
            <Box className="navbarTop" sx={{ color: "white", px: 3, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton size="small" sx={{ color: "white" }} onClick={onBack}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>NutriBase</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Teresa Pereira Soares {<StarBorderIcon />}</Typography>
                    <IconButton size="small" sx={{ color: "white" }} onClick={handleLogout} title="Logout">
                        <LogoutIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Box>

            <Container maxWidth={false} sx={{ py: 4 }}>
                {/* Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                    <Box>
                        <Typography variant="h2" sx={{ fontWeight: 700 }} color="text.primary">
                            {isNew ? "Novo Cliente" : form.name || "Cliente"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {isNew ? "Preencha os dados do novo cliente" : "Dados do cliente"}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button style={{ color: "#764248" }} startIcon={<PrintIcon />} onClick={handlePrint}>
                            Imprimir
                        </Button>
                        {!isNew && (
                            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
                                Eliminar
                            </Button>
                        )}
                        <Button style={{ backgroundColor: "#764248", color: "white" }} startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
                            {saving ? "A guardar..." : "Guardar"}
                        </Button>
                    </Stack>
                </Stack>

                <Grid container spacing={3}>
                    {/* ── Personal Data ────────────────────────────────────── */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Dados Pessoais</Typography>
                            <Stack spacing={2}>
                                <TextField label="Nome" fullWidth size="small" value={form.name} onChange={handleChange("name")} />
                                <Stack direction="row" spacing={2}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                                        <DatePicker
                                            label="Data de Nascimento"
                                            value={form.dateOfBirth ? dayjs(form.dateOfBirth) : null}
                                            onChange={(val) => handleChange("dateOfBirth")({
                                                target: { value: val ? val.format('YYYY-MM-DD') : '' }
                                            })}
                                            slotProps={{ textField: { size: 'small', sx: { flex: 1 } } }}
                                            format="DD/MM/YYYY"
                                        />
                                    </LocalizationProvider>
                                    <TextField
                                        label="Idade" size="small" value={form.age}
                                        sx={{ width: 100 }}
                                        InputProps={{ readOnly: true }}
                                    />
                                </Stack>
                                <TextField label="Sexo" select size="small" fullWidth value={form.gender} onChange={handleChange("gender")}>
                                    <MenuItem value="">-</MenuItem>
                                    <MenuItem value="M">Masculino</MenuItem>
                                    <MenuItem value="F">Feminino</MenuItem>
                                    <MenuItem value="O">Outro</MenuItem>
                                </TextField>
                                <TextField
                                    label="Telefone" fullWidth size="small"
                                    value={form.phone} onChange={handleChange("phone")}
                                    error={!!phoneError} helperText={phoneError}
                                    placeholder="912345678"
                                />
                                <TextField
                                    label="Email" fullWidth size="small"
                                    value={form.email} onChange={handleChange("email")}
                                    error={!!emailError} helperText={emailError}
                                    placeholder="exemplo@email.com"
                                />
                                <TextField label="Morada" fullWidth size="small" value={form.address} onChange={handleChange("address")} />
                                <TextField label="Profissão" fullWidth size="small" value={form.occupation} onChange={handleChange("occupation")} />
                                <TextField label="Motivo" fullWidth size="small" value={form.motivo} onChange={handleChange("motivo")} multiline rows={3} placeholder="Motivo da consulta..." />
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* ── History ───────────────────────────────────────────── */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Histórico</Typography>
                            <Tabs value={historyTab} onChange={(_, v) => setHistoryTab(v)} sx={{ mb: 2 }}>
                                <Tab label="Pessoal" />
                                <Tab label="Clínico" />
                                <Tab label="Alimentar" />
                            </Tabs>
                            <TextField
                                multiline rows={12} fullWidth
                                placeholder={
                                    historyTab === 0 ? "Histórico pessoal do cliente..."
                                        : historyTab === 1 ? "Histórico clínico do cliente..."
                                            : "Histórico alimentar do cliente..."
                                }
                                value={historyValue}
                                onChange={(e) => historySetters[historyTab](e.target.value)}
                            />
                        </Paper>
                    </Grid>

                    {/* ── Anthropometric Data ──────────────────────────────── */}
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 3 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>Dados Antropométricos</Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <ToggleButtonGroup
                                        value={anthroView} exclusive
                                        onChange={(_, v) => { if (v) setAnthroView(v); }}
                                        size="small"
                                    >
                                        <ToggleButton value="charts"><BarChartIcon fontSize="small" sx={{ mr: 0.5 }} /> Gráficos</ToggleButton>
                                        <ToggleButton value="table"><TableChartIcon fontSize="small" sx={{ mr: 0.5 }} /> Tabela</ToggleButton>
                                    </ToggleButtonGroup>
                                    <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addAnthropometricRow}>
                                        Nova Medição
                                    </Button>
                                </Stack>
                            </Stack>
                            {anthroView === "charts" ? (
                                <AnthroCharts data={chartData} />
                            ) : (
                                <AnthroTable data={anthropometricData} onUpdate={updateAnthropometricRow} onRemove={removeAnthropometricRow} />
                            )}
                        </Paper>
                    </Grid>

                    {/* ── Necessidades Energéticas ─────────────────────────── */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Necessidades Energéticas</Typography>
                            <Stack spacing={2}>
                                <TextField
                                    label="Metabolismo Basal (kcal)" size="small" fullWidth type="number"
                                    value={energyNeeds.basalMetabolism}
                                    onChange={(e) => setEnergyNeeds((p) => ({ ...p, basalMetabolism: e.target.value }))}
                                />
                                <TextField
                                    label="Fator de Atividade" size="small" fullWidth type="number"
                                    value={energyNeeds.activityFactor}
                                    onChange={(e) => setEnergyNeeds((p) => ({ ...p, activityFactor: e.target.value }))}
                                    inputProps={{ step: 0.1, min: 1, max: 3 }}
                                    helperText="1.2 Sedentário / 1.55 Moderado / 1.9 Muito ativo"
                                />
                                <TextField
                                    label="Necessidade Energética Total (kcal)" size="small" fullWidth type="number"
                                    value={energyNeeds.totalEnergy}
                                    onChange={(e) => setEnergyNeeds((p) => ({ ...p, totalEnergy: e.target.value }))}
                                />
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* ── Necessidades Hídricas ────────────────────────────── */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Necessidades Hídricas</Typography>
                            <Stack spacing={2}>
                                <TextField
                                    label="Base por peso (ml/kg)" size="small" fullWidth type="number"
                                    value={hydrationNeeds.weightBased}
                                    onChange={(e) => setHydrationNeeds((p) => ({ ...p, weightBased: e.target.value }))}
                                    helperText="Geralmente 30-35 ml/kg"
                                />
                                <TextField
                                    label="Total Hídrico (ml)" size="small" fullWidth type="number"
                                    value={hydrationNeeds.total}
                                    onChange={(e) => setHydrationNeeds((p) => ({ ...p, total: e.target.value }))}
                                />
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* ── Distribuição dos Macronutrientes ─────────────────── */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Distribuição dos Macronutrientes</Typography>
                            <Stack spacing={2}>
                                <Typography variant="subtitle2" color="text.secondary">Proteínas (4 kcal/g)</Typography>
                                <Stack direction="row" spacing={1}>
                                    <TextField
                                        label="%" size="small" type="number" sx={{ width: 80 }}
                                        value={macroDistribution.proteinPct}
                                        onChange={(e) => setMacroDistribution((p) => ({ ...p, proteinPct: e.target.value }))}
                                    />
                                    <TextField label="g" size="small" value={macroDistribution.proteinGrams} InputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                    <TextField label="kcal" size="small" value={macroDistribution.proteinKcal} InputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                </Stack>

                                <Typography variant="subtitle2" color="text.secondary">Hidratos de Carbono (4 kcal/g)</Typography>
                                <Stack direction="row" spacing={1}>
                                    <TextField
                                        label="%" size="small" type="number" sx={{ width: 80 }}
                                        value={macroDistribution.carbsPct}
                                        onChange={(e) => setMacroDistribution((p) => ({ ...p, carbsPct: e.target.value }))}
                                    />
                                    <TextField label="g" size="small" value={macroDistribution.carbsGrams} InputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                    <TextField label="kcal" size="small" value={macroDistribution.carbsKcal} InputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                </Stack>

                                <Typography variant="subtitle2" color="text.secondary">Lípidos (9 kcal/g)</Typography>
                                <Stack direction="row" spacing={1}>
                                    <TextField
                                        label="%" size="small" type="number" sx={{ width: 80 }}
                                        value={macroDistribution.fatPct}
                                        onChange={(e) => setMacroDistribution((p) => ({ ...p, fatPct: e.target.value }))}
                                    />
                                    <TextField label="g" size="small" value={macroDistribution.fatGrams} InputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                    <TextField label="kcal" size="small" value={macroDistribution.fatKcal} InputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                                </Stack>
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* ── Items / Additional Notes ─────────────────────────── */}
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 3 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>Itens / Notas Adicionais</Typography>
                                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addItem}>
                                    Adicionar Item
                                </Button>
                            </Stack>
                            {items.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                                    Sem itens adicionais. Clique em &quot;Adicionar Item&quot; para começar.
                                </Typography>
                            ) : (
                                <Stack spacing={2}>
                                    {items.map((item, idx) => (
                                        <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
                                            <Stack spacing={1.5}>
                                                {/* Text + actions row */}
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24, fontWeight: 600 }}>{idx + 1}.</Typography>
                                                    <TextField
                                                        fullWidth size="small" placeholder="Escreva uma nota..."
                                                        value={item.text} onChange={(e) => updateItem(item.id, e.target.value)}
                                                    />
                                                    <IconButton size="small" component="label" color="primary" title="Anexar ficheiro">
                                                        {uploading[item.id] ? <CircularProgress size={18} /> : <AttachFileIcon fontSize="small" />}
                                                        <input
                                                            type="file" multiple hidden
                                                            onChange={(e) => { handleFileUpload(item.id, e.target.files); e.target.value = ""; }}
                                                        />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => removeItem(item.id)} title="Remover item">
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>

                                                {/* Attached files */}
                                                {item.files?.length > 0 && (
                                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ pl: 4 }}>
                                                        {item.files.map((file) => (
                                                            <Chip
                                                                key={file.id}
                                                                icon={<InsertDriveFileIcon fontSize="small" />}
                                                                label={`${file.name} (${formatFileSize(file.size)})`}
                                                                variant="outlined"
                                                                size="small"
                                                                onDelete={() => removeFile(item.id, file.id)}
                                                                deleteIcon={<DeleteIcon fontSize="small" />}
                                                                onClick={() => downloadFile(file)}
                                                                sx={{ cursor: "pointer", maxWidth: 300 }}
                                                            />
                                                        ))}
                                                    </Stack>
                                                )}
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
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

function ChartPanel({ group, data }) {
    const [hiddenKeys, setHiddenKeys] = React.useState(new Set());

    const handleLegendClick = (entry) => {
        const key = entry.dataKey;
        setHiddenKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const renderLegend = (props) => {
        const { payload } = props;
        return (
            <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1.5, mt: 0.5 }}>
                {payload.map((entry) => {
                    const isHidden = hiddenKeys.has(entry.dataKey);
                    return (
                        <Box
                            key={entry.dataKey}
                            onClick={() => handleLegendClick(entry)}
                            sx={{
                                display: "flex", alignItems: "center", gap: 0.5,
                                cursor: "pointer", fontSize: 11, userSelect: "none",
                                opacity: isHidden ? 0.35 : 1,
                                textDecoration: isHidden ? "line-through" : "none",
                                "&:hover": { opacity: isHidden ? 0.5 : 0.8 },
                            }}
                        >
                            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: entry.color, flexShrink: 0 }} />
                            {entry.value}
                        </Box>
                    );
                })}
            </Box>
        );
    };

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{group.title}</Typography>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend content={renderLegend} />
                    {group.fields.map((f) => (
                        <Line
                            key={f.key} type="monotone" dataKey={f.key} name={f.label}
                            stroke={f.color} strokeWidth={2} dot={{ r: 3 }} connectNulls
                            hide={hiddenKeys.has(f.key)}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </Paper>
    );
}

function AnthroCharts({ data }) {
    if (data.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                Sem dados para mostrar. Adicione medições para ver os gráficos.
            </Typography>
        );
    }
    return (
        <Grid container spacing={3}>
            {CHART_GROUPS.map((group) => (
                <Grid size={{ xs: 12, md: 6 }} key={group.title}>
                    <ChartPanel group={group} data={data} />
                </Grid>
            ))}
        </Grid>
    );
}

function AnthroTable({ data, onUpdate, onRemove }) {
    if (data.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                Sem medições registadas. Clique em &quot;Nova Medição&quot; para adicionar.
            </Typography>
        );
    }
    return (
        <TableContainer sx={{ maxHeight: 500 }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "#f5f5f5" }}>Data</TableCell>
                        {ALL_TABLE_FIELDS.map((f) => (
                            <TableCell key={f.key} sx={{ fontWeight: 700, bgcolor: "#f5f5f5", whiteSpace: "nowrap" }}>{f.label}</TableCell>
                        ))}
                        <TableCell sx={{ bgcolor: "#f5f5f5" }} />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell>
                                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                                    <DatePicker
                                        value={row.date ? dayjs(row.date) : null}
                                        onChange={(val) => onUpdate(row.id, "date", val ? val.format('YYYY-MM-DD') : '')}
                                        format="DD/MM/YYYY"
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                variant: 'standard',
                                                sx: { width: 130 }
                                            }
                                        }}
                                    />
                                </LocalizationProvider>
                            </TableCell>
                            {ALL_TABLE_FIELDS.map((f) => (
                                <TableCell key={f.key}>
                                    <TextField size="small" variant="standard" type="number" value={row[f.key] ?? ""} onChange={(e) => onUpdate(row.id, f.key, e.target.value)} disabled={!!f.disabled} sx={{ width: 70 }} />
                                </TableCell>
                            ))}
                            <TableCell>
                                <IconButton size="small" color="error" onClick={() => onRemove(row.id)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
