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
    Checkbox,
    FormGroup,
    FormControlLabel,
    Divider,
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
import { auth, db, storage } from "../firebase-config";
import { doc, setDoc, deleteDoc, collection, getDocs, writeBatch } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
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
import { FactorPicker } from "./FactorPicker";
import { MacroSlider } from "./MacroSlider";
import Image from "next/image";
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
    { key: "bmiClass", label: "IMC CLASSE", disabled: true },
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

const ACTIVIDADE_FISICA = [
    { id: "acamado", label: "Acamado", kind: "range", min: 1.2, max: 1.2 },
    { id: "sedentario", label: "Sedentário/Repouso", kind: "range", min: 1.25, max: 1.25 },
    { id: "repouso", label: "Repouso", kind: "range", min: 1.3, max: 1.3 },
    { id: "ambulatorio", label: "Ambulatório", kind: "range", min: 1.5, max: 1.5 },
    { id: "moderada", label: "Com actividade moderada", kind: "range", min: 1.6, max: 1.7, step: 0.01 },
    { id: "intensa", label: "Com actividade intensa", kind: "range", min: 1.7, max: 2.5, step: 0.01 },

];

const FACTOR_STRESS = [
    { id: "semcomplicaçoes", label: "Sem Complicações", kind: "range", min: 1, max: 1 },
    { id: "pos-operatorio", label: "Pos-Operatório", kind: "range", min: 1.1, max: 1.1 },
    { id: "fractura", label: "Fractura", kind: "range", min: 1.2, max: 1.2 },
    { id: "infecçaograve", label: "Infecção Grave", kind: "range", min: 1.4, max: 1.4 },
    { id: "politraumatismo", label: "Politraumatismo", kind: "range", min: 1.5, max: 1.5 },
    { id: "queimaduras", label: "Queimaduras", kind: "range", min: 1.7, max: 2, step: 0.01 },
]

const FACTOR_TERMICO = [
    { id: "<38", label: "< 38ºC", kind: "range", min: 1, max: 1 },
    { id: "38", label: "38ºC", kind: "range", min: 1.1, max: 1.1 },
    { id: "39", label: "39ºC", kind: "range", min: 1.2, max: 1.2 },
    { id: "40", label: "40ºC Grave", kind: "range", min: 1.3, max: 1.3 },
]


const FACTOR_AGRESSAO = [
    { id: "malnutriçao", label: "Malnutrição", kind: "range", min: 0.7, max: 0.7 },
    { id: "sem-complicaçoes", label: "Sem Complicações", kind: "range", min: 1, max: 1, step: 0.01 },
    { id: "neoplasias", label: "Neoplasias", kind: "range", min: 1.1, max: 1.3, step: 0.01 },
    { id: "infecçao", label: "Infecção", kind: "range", min: 1.2, max: 1.2 },
    { id: "pequena-cirurgia", label: "Pequena Cirurgia", kind: "range", min: 1.2, max: 1.3, step: 0.01 },
    { id: "cirurgia-major", label: "Cirurgia Major", kind: "range", min: 1.2, max: 1.3, step: 0.01 },
    { id: "sepsis", label: "Sepsis", kind: "range", min: 1.3, max: 1.5, step: 0.01 },
    { id: "politraumatismo", label: "Politraumatismo", kind: "range", min: 1.4, max: 1.5, step: 0.01 },
    { id: "queimaduras", label: "Queimaduras", kind: "range", min: 1.5, max: 2, step: 0.01 },
]

const FACTOR_ANABOLICO = [
    { id: "manutencao", label: "Manutenção", kind: "range", min: 1, max: 1 },
    { id: "anabolismo", label: "Anabolismo", kind: "range", min: 1.2, max: 1.2 },
]

const EMPTY_ROW = {
    date: "", weight: "", height: "", bmi: "", bmiClass: "",
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
        phone: "", email: "", address: "", occupation: "", chosenWeight: "", chosenMB: "", chosenNET: "",
        motivo: "", isPregnant: false, breastFeeding: false, vM: "",
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

    const [activity, setActivity] = React.useState(
        client?.factors?.activity || { selectedId: "", value: "" }
    );
    const activityFactor = Number(activity.value) || 1;

    const [stress, setStress] = React.useState(
        client?.factors?.stress || { selectedId: "", value: "" }
    );
    const stressFactor = Number(stress.value) || 1;

    const [temp, setTemp] = React.useState(
        client?.factors?.temp || { selectedId: "", value: "" }
    );
    const tempFactor = Number(temp.value) || 1;

    const [aggression, setAggression] = React.useState(
        client?.factors?.aggression || { selectedId: "", value: "" }
    );
    const aggressionFactor = Number(aggression.value) || 1;

    const [ana, setAna] = React.useState(
        client?.factors?.ana || { selectedId: "", value: "" }
    );
    const anaFactor = Number(ana.value) || 1;

    const netSimple = () => {
        const mb = parseFloat(form.chosenMB);
        if (!Number.isFinite(mb)) return "";
        return Math.round(mb * activityFactor);
    };

    const netPrat = () => {
        const w = parseFloat(form.chosenWeight);
        const v = parseFloat(form.vM);

        return Math.round(v * w)
    }

    const netFNB = (rangeKey) => {
        const w = parseFloat(form.chosenWeight);
        const h = latestHeight;
        const hM = Number.isFinite(h) ? h / 100 : NaN;
        const a = parseFloat(form.age);

        if (!Number.isFinite(w)) return { M: "", F: "" };

        switch (rangeKey) {
            case "1-3": return { M: Math.round(89 * w - 100 + 20), F: Math.round(89 * w - 100 + 20) };
            case "3-8": return { M: Math.round(88.5 - (61.9 * a) + activityFactor * ((26.7 * w) + (903 * hM)) + 20), F: Math.round(135.3 - (30.8 * a) + activityFactor * ((10 * w) + (934 * hM)) + 20) };
            case "9-18": return { M: Math.round(88.5 - (61.9 * a) + activityFactor * ((26.7 * w) + (903 * hM)) + 25), F: Math.round(135.3 - (30.8 * a) + activityFactor * ((10 * w) + (934 * hM)) + 25) };
            case "19+": return { M: Math.round(662 - (9.53 * a) + activityFactor * ((15.91 * w) + (539.6 * hM))), F: Math.round(354 - (6.91 * a) + activityFactor * ((9.36 * w) + (726 * hM))) };
            default: return { M: "", F: "" };
        }
    };

    const netInfancia = (rangeKey) => {
        const w = parseFloat(form.chosenWeight) || latestWeight;
        if (!Number.isFinite(w)) return "";

        switch (rangeKey) {
            case "0-3": return Math.round((89 * w - 100) + 175);
            case "4-6": return Math.round((89 * w - 100) + 56);
            case "7-12": return Math.round((89 * w - 100) + 22);
            case "13-35": return Math.round((89 * w - 100) + 20);
            default: return "";
        }
    };

    const netGravidas = (trimestre) => {
        const w = parseFloat(form.chosenWeight);
        const h = latestHeight;
        const hM = Number.isFinite(h) ? h / 100 : NaN;
        const a = parseFloat(form.age);

        const mb = parseFloat(form.chosenMB);
        if (!Number.isFinite(mb)) return "";

        switch (trimestre) {
            case 1: return Math.round(354 - (6.91 * a) + activityFactor * ((9.36 * w) + (726 * hM)));
            case 2: return Math.round(354 - (6.91 * a) + activityFactor * ((9.36 * w) + (726 * hM)) + 340);
            case 3: return Math.round(354 - (6.91 * a) + activityFactor * ((9.36 * w) + (726 * hM)) + 452);
            default: return "";
        }
    };

    const netAmamentacao = (semestre) => {
        const w = parseFloat(form.chosenWeight);
        const h = latestHeight;
        const hM = Number.isFinite(h) ? h / 100 : NaN;
        const a = parseFloat(form.age);

        const mb = parseFloat(form.chosenMB);
        if (!Number.isFinite(mb)) return "";

        switch (semestre) {
            case 1: return Math.round(354 - (6.91 * a) + activityFactor * ((9.36 * w) + (726 * hM)) + 500 - 170);
            case 2: return Math.round(354 - (6.91 * a) + activityFactor * ((9.36 * w) + (726 * hM)) + 400);
            default: return "";
        }
    };

    const netDoentes = () => {
        const mb = parseFloat(form.chosenMB);
        if (!Number.isFinite(mb)) return "";
        return Math.round(mb * activityFactor * stressFactor * tempFactor * aggressionFactor * anaFactor);
    };

    const [dietPct, setDietPct] = React.useState(client?.dietPct || {
        proteinPct: 15,
        glucidPct: 65,
        lipidPct: 20,
        sugarPct: "",
        hidricoFactor: 1,
    });

    const handleSliderChange = React.useCallback(({ proteinPct, glucidPct, lipidPct }) => {
        setDietPct((prev) => ({ ...prev, proteinPct, glucidPct, lipidPct }));
    }, []);

    const dietCalc = (key) => {
        const net = parseFloat(form.chosenNET);
        if (!Number.isFinite(net)) return { g: "", kcal: "", pct: "" };

        const protPct = dietPct.proteinPct;
        const glucPct = dietPct.glucidPct;
        const lipPct = dietPct.lipidPct;

        switch (key) {
            case "Proteinas": {
                return { g: ((net * (protPct / 100)) / 4).toFixed(1), kcal: Math.round(net * (protPct / 100)), pct: Math.round(protPct) };
            }
            case "Lipidos": {
                return { g: ((net * (lipPct / 100)) / 9).toFixed(1), kcal: Math.round(net * (lipPct / 100)), pct: Math.round(lipPct) };
            }

            case "SFA": {
                return { g: (((((lipPct * 7) / 30) / 100) * net) / 9).toFixed(1), kcal: Math.round((((lipPct * 7) / 30) / 100) * net), pct: Math.round((lipPct * 7) / 30) };
            }
            case "PUFA": {
                return { g: (((((lipPct * 10) / 30) / 100) * net) / 9).toFixed(1), kcal: Math.round((((lipPct * 10) / 30) / 100) * net), pct: Math.round((lipPct * 10) / 30) };
            }
            case "MUFA": {
                return { g: (((((lipPct * 13) / 30) / 100) * net) / 9).toFixed(1), kcal: Math.round((((lipPct * 13) / 30) / 100) * net), pct: Math.round((lipPct * 13) / 30) };
            }
            case "Glicidos": {
                return { g: (((glucPct / 100) * net) / 4).toFixed(1), kcal: Math.round((glucPct / 100) * net), pct: Math.round(glucPct) };
            }
            case "Acucares": {
                const sPct = parseFloat(dietPct.sugarPct);
                if (!Number.isFinite(sPct)) return { g: "", kcal: "", pct: "" };
                return { g: (((sPct / 100) * net) / 4).toFixed(1), kcal: Math.round((sPct / 100) * net), pct: sPct };
            }
            case "Fibra": {
                return { g: ((net * 14) / 1000).toFixed(1), kcal: "", pct: "" };
            }
            default: return { g: "", kcal: "", pct: "" };
        }
    };

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
        const { type, checked, value } = e.target;
        setForm((prev) => ({ ...prev, [field]: type === "checkbox" ? checked : value }));
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

            const legacyFiles = [];
            const storageFiles = [];
            const itemsWithoutData = items.map((item) => {
                const fileMeta = (item.files || []).map((f) => {
                    if (f.storagePath || f.url) {
                        storageFiles.push({ ...f, itemId: item.id });
                        return { id: f.id, name: f.name, size: f.size, type: f.type, storagePath: f.storagePath || "", url: f.url || "" };
                    } else {
                        legacyFiles.push({ ...f, itemId: item.id });
                        return { id: f.id, name: f.name, size: f.size, type: f.type };
                    }
                });
                return { ...item, files: fileMeta };
            });

            if (!client?.id) {
                for (const file of storageFiles) {
                    if (file.storagePath && file.storagePath.includes("/clients/new/")) {
                        try {
                            const oldRef = storageRef(storage, file.storagePath);
                            const response = await fetch(file.url);
                            const blob = await response.blob();
                            const newPath = file.storagePath.replace("/clients/new/", `/clients/${clientId}/`);
                            const newRef = storageRef(storage, newPath);
                            await uploadBytes(newRef, blob);
                            const newUrl = await getDownloadURL(newRef);
                            file.storagePath = newPath;
                            file.url = newUrl;
                            for (const item of itemsWithoutData) {
                                const fm = item.files.find((f) => f.id === file.id);
                                if (fm) { fm.storagePath = newPath; fm.url = newUrl; }
                            }
                            try { await deleteObject(oldRef); } catch (e) { /* ignore */ }
                        } catch (e) {
                            console.warn("Could not move file to new path:", e);
                        }
                    }
                }
            }

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
                factors: { activity, stress, temp, aggression, ana },
                dietPct,
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
            for (const file of legacyFiles) {
                const fileEncrypted = await encryptData({ data: file.data }, userId);
                batch.set(doc(filesColRef, file.id), {
                    itemId: file.itemId,
                    encryptedData: fileEncrypted.encryptedData,
                    iv: fileEncrypted.iv,
                });
            }
            await batch.commit();

            setSnackbar({ open: true, message: "Cliente guardado com sucesso!", severity: "success" });

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

    const classifyBmi = (bmi, age, gender) => {
        const ageNum = Number(age);
        const isElderly = Number.isFinite(ageNum) && ageNum > 65;

        if (isElderly) {
            const obesityThreshold = gender === "M" ? 30 : gender === "F" ? 32 : 30;

            if (bmi > obesityThreshold) return "Obesidade";
            if (bmi > 27) return "Excesso ponderal";
            if (bmi >= 22) return "Eutrofia";
            return "Magreza";
        }

        if (bmi < 16.0) return "Desnutrição Severa";
        if (bmi < 17.0) return "Desnutrição Moderada";
        if (bmi < 18.5) return "Baixo peso";
        if (bmi < 25.0) return "Eutrofia";
        if (bmi < 30.0) return "Excesso peso";
        if (bmi < 35.0) return "Obesidade classe I";
        if (bmi < 40.0) return "Obesidade Classe II";
        return "Obesidade Classe III";
    };

    const updateAnthropometricRow = (id, field, value) => {
        setAnthropometricData((prev) =>
            prev.map((row) => {
                if (row.id !== id) return row;

                const updated = { ...row, [field]: value };

                if (field === "weight" || field === "height") {
                    const w = parseFloat(updated.weight);
                    const hCm = parseFloat(updated.height);

                    if (!Number.isFinite(w) || !Number.isFinite(hCm) || hCm <= 0) {
                        updated.bmi = "";
                        updated.bmiClass = "";
                        return updated;
                    }

                    const h = hCm / 100;
                    const bmiNum = w / (h * h);

                    updated.bmi = bmiNum.toFixed(1);
                    updated.bmiClass = classifyBmi(bmiNum, form.age, form.gender);
                }

                return updated;
            })
        );
    };

    const latestHeight = React.useMemo(() => {
        const sorted = [...anthropometricData]
            .filter((r) => r.height && r.date)
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        return sorted.length > 0 ? parseFloat(sorted[0].height) : NaN;
    }, [anthropometricData]);

    const latestWeight = React.useMemo(() => {
        const sorted = [...anthropometricData]
            .filter((r) => r.weight && r.date)
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        return sorted.length > 0 ? parseFloat(sorted[0].weight) : NaN;
    }, [anthropometricData]);

    const mbCalculator = (heightCm, weightKg, age, gender, type) => {
        const h = parseFloat(heightCm);
        const w = parseFloat(weightKg);
        const a = parseFloat(age);
        if (!Number.isFinite(h) || !Number.isFinite(w) || !Number.isFinite(a) || !gender) return "";

        if (type === "Harris-Benedict") {
            if (gender === "M") return Math.round(66.5 + 13.7 * w + 5 * h - 6.8 * a);
            if (gender === "F") return Math.round(655.1 + 9.56 * w + 1.85 * h - 4.7 * a);
        }

        if (type === "Mifflin-St Jeor") {
            if (gender === "M") return Math.round(10 * w + 6.26 * h - 5 * a + 5);
            if (gender === "F") return Math.round(10 * w + 6.26 * h - 5 * a - 161);
        }

        if (type === "OMS") {
            const hM = h / 100;
            if (a >= 18 && a < 30) {
                if (gender === "M") return Math.round(64.4 * w - 113 * hM + 3000);
                if (gender === "F") return Math.round(55.6 * w - 1397.4 * hM + 146);
            }
            if (a >= 30 && a < 60) {
                if (gender === "M") return Math.round(19.2 * w + 66.9 * hM + 3769);
                if (gender === "F") return Math.round(36.4 * w - 104.6 * hM + 3619);
            }
            if (a >= 60) {
                if (gender === "M") return Math.round(13.5 * w + 487);
                if (gender === "F") return Math.round(10.5 * w + 596);
            }
        }

        if (type === "FAO/WHO") {
            if (a >= 0 && a < 3) {
                if (gender === "M") return Math.round(60.9 * w - 54);
                if (gender === "F") return Math.round(61 * w - 51);
            }
            if (a >= 3 && a < 10) {
                if (gender === "M") return Math.round(22.7 * w + 495);
                if (gender === "F") return Math.round(22.5 * w + 499);
            }
            if (a >= 10 && a < 18) {
                if (gender === "M") return Math.round(17.5 * w + 651);
                if (gender === "F") return Math.round(12.2 * w + 746);
            }
            if (a >= 18 && a < 30) {
                if (gender === "M") return Math.round(15.3 * w + 679);
                if (gender === "F") return Math.round(14.7 * w + 496);
            }
            if (a >= 30 && a < 60) {
                if (gender === "M") return Math.round(11.6 * w + 879);
                if (gender === "F") return Math.round(8.7 * w + 829);
            }
            if (a >= 60) {
                if (gender === "M") return Math.round(13.5 * w + 487);
                if (gender === "F") return Math.round(10.5 * w + 596);
            }
        }

        return "";
    };

    const calcWeight = (height, peso, gender, type) => {
        const h = parseFloat(height);
        const p = parseFloat(peso);
        if (!Number.isFinite(h) || !gender) return "";

        if (gender === "M") {
            const weight = h - 100 - ((h - 150) / 4);
            if (type === "Healthy") return Math.round(weight * 10) / 10;
            if (!Number.isFinite(p)) return "";
            return Math.round((weight + 0.25 * (p - weight)) * 10) / 10;
        }
        if (gender === "F") {
            const weight = h - 100 - ((h - 150) / 2);
            if (type === "Healthy") return Math.round(weight * 10) / 10;
            if (!Number.isFinite(p)) return "";
            return Math.round((weight + 0.25 * (p - weight)) * 10) / 10;
        }
        return "";
    };

    const removeAnthropometricRow = (id) => {
        setAnthropometricData((prev) => prev.filter((row) => row.id !== id));
    };

    const [uploading, setUploading] = React.useState({});
    const MAX_FILE_SIZE = 25 * 1024 * 1024;

    const addItem = () => {
        setItems((prev) => [...prev, { id: crypto.randomUUID(), text: "", files: [] }]);
    };
    const updateItem = (id, text) => {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, text } : it)));
    };
    const removeItem = (id) => {
        setItems((prev) => prev.filter((it) => it.id !== id));
    };

    const handleFileUpload = async (itemId, fileList) => {
        if (!fileList?.length) return;
        const userId = auth.currentUser?.uid;
        if (!userId) {
            setSnackbar({ open: true, message: "Utilizador não autenticado.", severity: "error" });
            return;
        }
        setUploading((prev) => ({ ...prev, [itemId]: true }));

        try {
            const newFiles = [];
            for (const file of Array.from(fileList)) {
                if (file.size > MAX_FILE_SIZE) {
                    setSnackbar({ open: true, message: `"${file.name}" excede 25MB.`, severity: "warning" });
                    continue;
                }
                const fileId = crypto.randomUUID();
                const clientId = client?.id || "new";
                const filePath = `users/${userId}/clients/${clientId}/files/${fileId}_${file.name}`;
                const fileRef = storageRef(storage, filePath);
                await uploadBytes(fileRef, file);
                const downloadURL = await getDownloadURL(fileRef);
                newFiles.push({
                    id: fileId,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    storagePath: filePath,
                    url: downloadURL,
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
            console.error("Error uploading file:", error);
            setSnackbar({ open: true, message: "Erro ao carregar ficheiro: " + error.message, severity: "error" });
        } finally {
            setUploading((prev) => ({ ...prev, [itemId]: false }));
        }
    };

    const removeFile = async (itemId, fileId) => {
        const item = items.find((it) => it.id === itemId);
        const file = item?.files?.find((f) => f.id === fileId);
        if (file?.storagePath) {
            try {
                await deleteObject(storageRef(storage, file.storagePath));
            } catch (err) {
                console.warn("Could not delete file from Storage:", err);
            }
        }
        setItems((prev) =>
            prev.map((it) =>
                it.id === itemId
                    ? { ...it, files: (it.files || []).filter((f) => f.id !== fileId) }
                    : it
            )
        );
    };

    const downloadFile = (file) => {
        if (file.url) {
            window.open(file.url, "_blank");
        } else if (file.data) {
            const link = document.createElement("a");
            link.href = file.data;
            link.download = file.name;
            link.click();
        }
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
                                <FormGroup >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={!!form.isPregnant}
                                                onChange={handleChange("isPregnant")}
                                            />
                                        }
                                        label="Grávida"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={!!form.breastFeeding}
                                                onChange={handleChange("breastFeeding")}
                                            />
                                        }
                                        label="Amamentação"
                                    />
                                </FormGroup>
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
                                multiline rows={21} fullWidth
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
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Necessidades Energéticas</Typography>
                            <Stack spacing={2}>
                                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                    <Stack sx={{ flex: 1 }} spacing={2}>
                                        <TextField
                                            label="Peso Escolhido (kg)" size="small" fullWidth type="number"
                                            value={form.chosenWeight}
                                            onChange={handleChange("chosenWeight")}
                                        />
                                        <TextField
                                            label="Peso Saudável" size="small" fullWidth type="number"
                                            value={calcWeight(latestHeight, latestWeight, form.gender, "Healthy")}
                                            InputProps={{ readOnly: true }}
                                        />
                                        <TextField
                                            label="Peso Ajustado" size="small" fullWidth type="number"
                                            value={calcWeight(latestHeight, latestWeight, form.gender, "Ajusted")}
                                            InputProps={{ readOnly: true }}
                                        />
                                    </Stack>
                                    <Stack sx={{ flex: 1 }} spacing={2}>
                                        <TextField
                                            label="Altura (cm)" size="small" fullWidth
                                            value={Number.isFinite(latestHeight) ? latestHeight : ""}
                                            InputProps={{ readOnly: true }}
                                            helperText="Última medição"
                                        />
                                    </Stack>



                                </Stack>

                                <Typography variant="subtitle2" color="text.secondary">Fórmulas MB (kcal/dia)</Typography>
                                <Stack direction="row" spacing={4}>
                                    <TextField
                                        label="Harris-Benedict" size="small" fullWidth
                                        value={mbCalculator(latestHeight, form.chosenWeight, form.age, form.gender, "Harris-Benedict")}
                                        InputProps={{ readOnly: true }}
                                    />
                                    <TextField
                                        label="Mifflin-St Jeor" size="small" fullWidth
                                        value={mbCalculator(latestHeight, form.chosenWeight, form.age, form.gender, "Mifflin-St Jeor")}
                                        InputProps={{ readOnly: true }}
                                    />
                                    <TextField
                                        label="OMS" size="small" fullWidth
                                        value={mbCalculator(latestHeight, form.chosenWeight, form.age, form.gender, "OMS")}
                                        InputProps={{ readOnly: true }}
                                    />
                                    <TextField
                                        label="FAO/WHO" size="small" fullWidth
                                        value={mbCalculator(latestHeight, form.chosenWeight, form.age, form.gender, "FAO/WHO")}
                                        InputProps={{ readOnly: true }}
                                    />
                                </Stack>
                                <TextField
                                    label="MB Escolhido (kcal)" size="small" fullWidth select
                                    value={form.chosenMB}
                                    onChange={handleChange("chosenMB")}
                                    helperText="Escolha o valor de uma das fórmulas acima"
                                >
                                    <MenuItem value="">-</MenuItem>
                                    {[
                                        { label: "Harris-Benedict", type: "Harris-Benedict" },
                                        { label: "Mifflin-St Jeor", type: "Mifflin-St Jeor" },
                                        { label: "OMS", type: "OMS" },
                                        { label: "FAO/WHO", type: "FAO/WHO" },
                                    ].map(({ label, type }) => {
                                        const val = mbCalculator(latestHeight, form.chosenWeight, form.age, form.gender, type);
                                        return val ? (
                                            <MenuItem key={type} value={String(val)}>
                                                {label}: {val} kcal
                                            </MenuItem>
                                        ) : null;
                                    })}
                                </TextField>
                                <Stack spacing={2} direction="row">
                                    <FactorPicker
                                        title="Actividade física"
                                        options={ACTIVIDADE_FISICA}
                                        selectedId={activity.selectedId}
                                        value={activity.value}
                                        onChange={({ selectedId, value }) => setActivity({ selectedId, value })}
                                    />
                                    <FactorPicker
                                        title="Factor de Stress"
                                        options={FACTOR_STRESS}
                                        selectedId={stress.selectedId}
                                        value={stress.value}
                                        onChange={({ selectedId, value }) => setStress({ selectedId, value })}
                                    />
                                    <FactorPicker
                                        title="Factor Térmico"
                                        options={FACTOR_TERMICO}
                                        selectedId={temp.selectedId}
                                        value={temp.value}
                                        onChange={({ selectedId, value }) => setTemp({ selectedId, value })}
                                    />
                                </Stack>
                                <Stack direction="row" spacing={2}>
                                    <FactorPicker
                                        title="Factor de Agressão"
                                        options={FACTOR_AGRESSAO}
                                        selectedId={aggression.selectedId}
                                        value={aggression.value}
                                        onChange={({ selectedId, value }) => setAggression({ selectedId, value })}
                                    />
                                    <FactorPicker
                                        title="Factor Anabólico"
                                        options={FACTOR_ANABOLICO}
                                        selectedId={ana.selectedId}
                                        value={ana.value}
                                        onChange={({ selectedId, value }) => setAna({ selectedId, value })}
                                    />
                                </Stack>
                                {/* ── NET (MB × Fator Atividade) ──────────────── */}
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    NET (Metabolismo Basal × Fator Atividade)
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="Fator Atividade" size="small"
                                        value={activityFactor}
                                        InputProps={{ readOnly: true }}
                                        sx={{ width: 160 }}
                                    />
                                    <TextField
                                        label="NET (kcal)" size="small" fullWidth
                                        value={netSimple()}
                                        InputProps={{ readOnly: true }}
                                    />
                                </Stack>

                                {/* ── NET Food and Nutrition Board ───────────── */}
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    NET (Food and Nutrition Board, Institute of Medicine)
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>Idade</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Masculino</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Feminino</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {[
                                                { label: "1-3 Anos", key: "1-3" },
                                                { label: "3-8 Anos", key: "3-8" },
                                                { label: "9-18 Anos", key: "9-18" },
                                                { label: ">19 Anos", key: "19+" },
                                            ].map((row) => {
                                                const vals = netFNB(row.key);
                                                return (
                                                    <TableRow key={row.key}>
                                                        <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>{row.label}</TableCell>
                                                        <TableCell>{vals.M}</TableCell>
                                                        <TableCell>{vals.F}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* ── NET Infância ────────────────────────────── */}
                                {form.age < 3 && (
                                    <>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                            NET Infância
                                        </Typography>
                                        <Stack spacing={1}>
                                            {[
                                                { label: "0-3 Meses", key: "0-3" },
                                                { label: "4-6 Meses", key: "4-6" },
                                                { label: "7-12 Meses", key: "7-12" },
                                                { label: "13-35 Meses", key: "13-35" },
                                            ].map((row) => (
                                                <Stack key={row.key} direction="row" spacing={2} alignItems="center">
                                                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 100, whiteSpace: "nowrap" }}>
                                                        {row.label}
                                                    </Typography>
                                                    <TextField
                                                        size="small" fullWidth
                                                        value={netInfancia(row.key)}
                                                        InputProps={{ readOnly: true }}
                                                    />
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </>
                                )}

                                {/* ── NET Grávidas ──────── */}
                                {form.isPregnant && (
                                    <>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                            NET Grávidas
                                        </Typography>
                                        <Stack spacing={1}>
                                            {[
                                                { label: "1º Trimestre", tri: 1 },
                                                { label: "2º Trimestre", tri: 2 },
                                                { label: "3º Trimestre", tri: 3 },
                                            ].map((row) => (
                                                <Stack key={row.tri} direction="row" spacing={2} alignItems="center">
                                                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 100, whiteSpace: "nowrap" }}>
                                                        {row.label}
                                                    </Typography>
                                                    <TextField
                                                        size="small" fullWidth
                                                        value={netGravidas(row.tri)}
                                                        InputProps={{ readOnly: true }}
                                                    />
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </>
                                )}

                                {/* ── NET Amamentação ── */}
                                {form.breastFeeding && (
                                    <>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                            NET Amamentação
                                        </Typography>
                                        <Stack spacing={1}>
                                            {[
                                                { label: "1º Semestre", sem: 1 },
                                                { label: "2º Semestre", sem: 2 },
                                            ].map((row) => (
                                                <Stack key={row.sem} direction="row" spacing={2} alignItems="center">
                                                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 100, whiteSpace: "nowrap" }}>
                                                        {row.label}
                                                    </Typography>
                                                    <TextField
                                                        size="small" fullWidth
                                                        value={netAmamentacao(row.sem)}
                                                        InputProps={{ readOnly: true }}
                                                    />
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </>
                                )}

                                {/* ── NET Indivíduos Doentes ──────────────────── */}
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    NET Indivíduos Doentes
                                </Typography>
                                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                                    <TextField label="F. Actividade" size="small" value={activityFactor} InputProps={{ readOnly: true }} sx={{ width: 120 }} />
                                    <TextField label="F. Stress" size="small" value={stressFactor} InputProps={{ readOnly: true }} sx={{ width: 120 }} />
                                    <TextField label="F. Térmico" size="small" value={tempFactor} InputProps={{ readOnly: true }} sx={{ width: 120 }} />
                                    <TextField label="F. Agressão" size="small" value={aggressionFactor} InputProps={{ readOnly: true }} sx={{ width: 120 }} />
                                    <TextField label="F. Anabólico" size="small" value={anaFactor} InputProps={{ readOnly: true }} sx={{ width: 120 }} />
                                </Stack>
                                <TextField
                                    label="NET Doentes (kcal)" size="small" fullWidth
                                    value={netDoentes()}
                                    InputProps={{ readOnly: true }}
                                />

                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    NET (Regra Prática)
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="Valor a Multiplicar" size="small" fullWidth type="number"
                                        value={form.vM}
                                        onChange={handleChange("vM")}
                                    />
                                    <TextField
                                        label="NET (kcal)" size="small" fullWidth
                                        value={netPrat()}
                                        InputProps={{ readOnly: true }}
                                    />

                                    <Image
                                        src="/Images/Picture1.png"
                                        alt="Teresa"
                                        width={3000}
                                        height={100}
                                        style={{ borderRadius: "8px", objectFit: "cover" }}
                                    />
                                </Stack>

                                <Divider sx={{ my: 1 }} />

                            </Stack>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Fórmula Dietética</Typography>
                            <Stack spacing={2}>
                                <TextField
                                    label="NET Escolhida" size="small" fullWidth
                                    value={form.chosenNET}
                                    onChange={handleChange("chosenNET")}
                                    helperText="Escolha o valor de uma das fórmulas acima"
                                />

                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    Fórmula Dietética por percentagens
                                </Typography>

                                <MacroSlider
                                    proteinPct={dietPct.proteinPct}
                                    glucidPct={dietPct.glucidPct}
                                    lipidPct={dietPct.lipidPct}
                                    onChange={handleSliderChange}
                                    net={form.chosenNET}
                                    weight={form.chosenWeight}
                                />

                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}></TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>g</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>kcal</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>(%)</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {[
                                                { label: "Proteínas", key: "Proteinas" },
                                                { label: "Lípidos", key: "Lipidos" },
                                                { label: "SFA máx 10%", key: "SFA", indent: true },
                                                { label: "PUFA máx 10%", key: "PUFA", indent: true },
                                                { label: "MUFA máx 20%", key: "MUFA", indent: true },
                                                { label: "Glícidos", key: "Glicidos" },
                                                { label: "Açúcares Simples", key: "Acucares", indent: true, pctEditable: true },
                                                { label: "Fibra 14g/1000kcal", key: "Fibra" },
                                            ].map((row) => {
                                                const vals = dietCalc(row.key);
                                                return (
                                                    <TableRow key={row.key}>
                                                        <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap", pl: row.indent ? 4 : 2 }}>
                                                            {row.label}
                                                        </TableCell>
                                                        <TableCell>{vals.g}</TableCell>
                                                        <TableCell>{vals.kcal}</TableCell>
                                                        <TableCell>
                                                            {row.pctEditable ? (
                                                                <TextField
                                                                    size="small" variant="standard" type="number"
                                                                    value={dietPct.sugarPct}
                                                                    onChange={(e) => setDietPct((prev) => ({ ...prev, sugarPct: e.target.value }))}
                                                                    sx={{ width: 70 }}
                                                                    inputProps={{ step: 0.5, min: 0, max: 100 }}
                                                                />

                                                            ) : (
                                                                <Typography variant="body2">
                                                                    {vals.pct !== "" ? `${vals.pct}%` : ""}
                                                                </Typography>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* ── Aporte Hídrico ──────────────────────── */}
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    Aporte Hídrico (1–1,5 ml/kcal)
                                </Typography>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <TextField
                                        label="ml/kcal" size="small" type="number"
                                        value={dietPct.hidricoFactor}
                                        onChange={(e) => setDietPct((prev) => ({ ...prev, hidricoFactor: e.target.value }))}
                                        inputProps={{ step: 0.1, min: 1, max: 1.5 }}
                                        sx={{ width: 120 }}
                                    />
                                    <TextField
                                        label="Total (ml)" size="small" fullWidth
                                        value={(() => {
                                            const net = parseFloat(form.chosenNET);
                                            const f = parseFloat(dietPct.hidricoFactor);
                                            if (!Number.isFinite(net) || !Number.isFinite(f)) return "";
                                            return Math.round(f * net);
                                        })()}
                                        InputProps={{ readOnly: true }}
                                    />
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
        </Box >
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
                                    <TextField
                                        size="small"
                                        variant="standard"
                                        type={f.key === "bmiClass" ? "text" : "number"}
                                        value={row[f.key] ?? ""}
                                        onChange={(e) => onUpdate(row.id, f.key, e.target.value)}
                                        disabled={!!f.disabled}
                                        sx={{ width: f.key === "bmiClass" ? 160 : 70 }}
                                    />
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
