import React from 'react';
import { Route, Routes } from 'react-router';

import '../../assets/css/routes/account/style.css';

import AccountPage from './accountPage';
import ProfilePage from './profilePage';

export default function LoginRoute() {
    return (
        <main className="accountPage">
            <Routes>
                <Route exact path="/" element={<AccountPage />} />
                <Route path="/profile/*">
                    <Route path=":profileId" element={<ProfilePage />} />
                </Route>
            </Routes>
        </main>
    );
}
