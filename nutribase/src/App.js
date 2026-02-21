"use client"
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";


import Login from "./Components/Login";
import { auth } from "./firebase-config";
import LandingPage from "./Components/LandingPage"

const theme = createTheme({
    palette: {
        primary: {
            main: '#764248',

        },
        secondary: {
            main: '#CACEB7'

        }
    }
});

function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const manualSetCurrentUser = (user) => {
        setCurrentUser(user);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Router>
            <div>
                <nav>
                    <ul>{currentUser ? <></> : <></>}</ul>
                </nav>
                <Routes>
                    {currentUser != null && currentUser.emailVerified ? (
                        <>
                            <Route path='/' element={<LandingPage />} />

                        </>
                    ) : (
                        <>
                            <Route
                                path='/'
                                element={<Login manualSetCurrentUser={manualSetCurrentUser} />}
                            />
                            <Route path='/register' element={<Register />} />
                        </>
                    )}
                </Routes>
            </div>
        </Router>
    );
}

export default App;
