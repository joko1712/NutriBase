export interface Client {
    id: string;
    name: string;
    age: number;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email: string;
    address: string;
    occupation: string;
    chosenWeight: number;
    chosenMB: number;
    chosenNET: number; 
    vM: number;
    lastConsultation: string;
    personalHistory: string;
    clinicalHistory: string;
    alimentarHistory: string;
    anthropometricData: AnthropometricEntry[];
    items: ClientItem[];
}

export interface AnthropometricEntry {
    id: string;
    date: string;
    // Altura / Peso / IMC
    weight: number;
    height: number;
    bmi: number;
    bmiClass: string;
    // Composição Corporal
    bodyFat: number;
    muscleMass: number;
    visceralFat: number;
    water: number;
    // Pregas Cutâneas
    tricep: number;
    subscapular: number;
    suprailiac: number;
    abdominalFold: number;
    thighFold: number;
    calfFold: number;
    // Perímetros
    waist: number;
    hip: number;
    arm: number;
    thigh: number;
    chest: number;
    calf: number;
}

export interface ClientItem {
    id: string;
    text: string;
}

export const emptyClient: Client = {
    id: "",
    name: "",
    age: 0,
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    occupation: "",
    chosenWeight: 0,
    chosenNET:0,
    vM:0,
    chosenMB: 0,
    lastConsultation: "",
    personalHistory: "",
    clinicalHistory: "",
    alimentarHistory: "",
    anthropometricData: [],
    items: [],
};
