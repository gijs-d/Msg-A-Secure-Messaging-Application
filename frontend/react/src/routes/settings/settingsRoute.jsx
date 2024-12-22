import React from 'react';
import { Route, Routes } from 'react-router';

import '../../assets/css/routes/settings/style.css';
import SettingsPage from './settingsPage';

export default function SettingsRoute() {
    return (
        <main className="settingsPage">
            <Routes>
                <Route exact path="/" element={<SettingsPage />} />
            </Routes>
        </main>
    );
}
