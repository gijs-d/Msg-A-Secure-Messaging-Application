import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import LoginRoute from './login/login-route';
import AccountRoute from './account/account-route';
import SettingsRoute from './settings/settings-route';
import MessageRoute from './message/message-route';
import CallMessageRoute from './call/call-route';

import { contexts } from '../providers';
const { useUserLogdinContext, useCallContext } = contexts;

const Router = () => {
    const { userLogdin, setUserLogdin } = useUserLogdinContext();

    const { calling, setCalling } = useCallContext();

    return (
        <>
            {userLogdin ? (
                <>
                    {calling.status ? (
                        <Routes>
                            <Route path="/call" element={<CallMessageRoute />} />
                            <Route path="/*" element={<Navigate to="/call" />} />
                        </Routes>
                    ) : (
                        <Routes>
                            <Route exact path="/" element={<Navigate to="/account" />} />
                            <Route path="/account/*" element={<AccountRoute />} />
                            <Route path="/settings/*" element={<SettingsRoute />} />
                            <Route path="/message/*" element={<MessageRoute />} />
                            <Route path="/android" element={<></>} />
                            <Route path="/*" element={<Navigate to="/" />} />
                        </Routes>
                    )}
                </>
            ) : (
                <Routes>
                    <Route exact path="/" element={<Navigate to="/login" />} />
                    <Route path="/login/*" element={<LoginRoute />} />
                    <Route path="/*" element={<Navigate to="/" />} />
                </Routes>
            )}
        </>
    );
};

export default Router;
