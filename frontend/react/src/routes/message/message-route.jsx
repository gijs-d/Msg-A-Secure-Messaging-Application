import React from 'react';
import { Route, Routes } from 'react-router';

import '../../assets/css/routes/message/style.css';
import '../../assets/css/routes/message/chat.css';
import '../../assets/css/routes/message/sidebar.css';

import Message from './message';

export default function MessageRoute() {
    return (
        <main className="messagePage">
            <Routes>
                <Route exact path="/" element={<Message />} />
            </Routes>
        </main>
    );
}
