"use client";

import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";

import { auth } from "../firebase-config";
import Login from "../Components/Login";
import ClientList from "../Components/ClientList";
import ClientDetail from "../Components/ClientDetail";
import DisponibilidadeSettings from "../Components/DisponibilidadeSettings";

type View = "list" | "detail" | "new" | "availability";

export default function AuthGate() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>("list");
    const [selectedClient, setSelectedClient] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const manualSetCurrentUser = (user: User) => {
        setCurrentUser(user);
    };

    if (loading) return <div>Loading...</div>;

    if (!currentUser || !currentUser.emailVerified) {
        return <Login manualSetCurrentUser={manualSetCurrentUser} />;
    }

    if (view === "detail" && selectedClient) {
        return (
            <ClientDetail
                client={selectedClient}
                isNew={false}
                onBack={() => {
                    setView("list");
                    setSelectedClient(null);
                }}
            />
        );
    }

    if (view === "new") {
        return (
            <ClientDetail
                client={selectedClient}
                isNew={true}
                onBack={() => {
                    setView("list");
                    setSelectedClient(null);
                }}
            />
        );
    }

    if (view === "availability") {
        return (
            <DisponibilidadeSettings
                onBack={() => setView("list")}
            />
        );
    }

    return (
        <ClientList
            onSelectClient={(client: any) => {
                setSelectedClient(client);
                setView("detail");
            }}
            onNewClient={() => {
                setSelectedClient(null);
                setView("new");
            }}
            onNewClientFromBooking={(prefill: any) => {
                setSelectedClient(prefill);
                setView("new");
            }}
            onAvailability={() => setView("availability")}
        />
    );
}
