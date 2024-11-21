import React from 'react';
import { Route, Routes } from 'react-router';

import '../../assets/css/routes/login/style.css';

import Login from './login';
import Register from './register';

export default function LoginRoute() {
    return (
        <main className="loginPage">
            <Routes>
                <Route exact path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Routes>
        </main>
    );
}
