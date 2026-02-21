"use client";
import React from "react";
import ClientList from "./ClientList";

function LandingPage({ user }) {
    return <ClientList userEmail={user.email} userId={user.uid} />;
}




export default LandingPage;
