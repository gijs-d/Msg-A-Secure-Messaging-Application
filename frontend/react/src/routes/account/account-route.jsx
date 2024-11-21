import React from 'react';
import { Route, Routes } from 'react-router';

import '../../assets/css/routes/account/style.css';

import Account from './account';
import Profile from './profile';

export default function LoginRoute() {
    return (
        <main className="accountPage">
            <Routes>
                <Route exact path="/" element={<Account />} />
                <Route path="/profile/*">
                    <Route path=":profileId" element={<Profile />} />
                </Route>
            </Routes>
        </main>
    );
}
