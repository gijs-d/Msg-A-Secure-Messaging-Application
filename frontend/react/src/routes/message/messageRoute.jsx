import React from 'react';
import { Route, Routes } from 'react-router';

import '../../assets/css/routes/message/style.css';
import '../../assets/css/routes/message/chat.css';
import '../../assets/css/routes/message/sidebar.css';

import MessagePage from './messagePage';

export default function MessageRoute() {
    return (
        <main className="messagePage">
            <Routes>
                <Route exact path="/" element={<MessagePage />} />
            </Routes>
        </main>
    );
}
