import React from 'react';
import { Route, Routes } from 'react-router';

import '../../assets/css/routes/login/style.css';

import LoginPage from './loginPage';
import RegisterPage from './registerPage';

export default function LoginRoute() {
    return (
        <main className="loginPage">
            <Routes>
                <Route exact path="/" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Routes>
        </main>
    );
}
