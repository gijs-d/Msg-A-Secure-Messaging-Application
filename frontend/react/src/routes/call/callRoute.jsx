import React from 'react';
import { Route, Routes } from 'react-router';

import '../../assets/css/routes/call/style.css';

import CallPage from './callPage';

export default function SettingsRoute() {
    return (
        <main className="callingPage">
            <Routes>
                <Route exact path="/" element={<CallPage />} />
            </Routes>
        </main>
    );
}
