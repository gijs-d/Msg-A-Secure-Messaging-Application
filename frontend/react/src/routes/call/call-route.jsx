import React from 'react';
import { Route, Routes } from 'react-router';

import '../../assets/css/routes/call/style.css';

import Call from './call';

export default function SettingsRoute() {
    return (
        <main className="callingPage">
            <Routes>
                <Route exact path="/" element={<Call />} />
            </Routes>
        </main>
    );
}
