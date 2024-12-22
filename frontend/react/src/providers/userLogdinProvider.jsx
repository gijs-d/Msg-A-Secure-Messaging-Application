import React, { createContext, useContext, useState, useEffect } from 'react';

import { socket } from '../lib/socket';
const UserLogdinContext = createContext(null);

export function UserLogdinProvider({ children }) {
    const [userLogdin, setUserLogdin] = useState(undefined);
    const [connected, setConnected] = useState(socket.connected);

    useEffect(() => {
        fetchLogdin();
    }, []);

    useEffect(() => {
        if (!userLogdin && connected) {
            socket.disconnect();
            return;
        }
        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));
        if (userLogdin && !connected) {
            socket.connect();
        }
        return () => {
            socket.off('connect', () => setConnected(true));
            socket.off('disconnect', () => setConnected(false));
        };
    }, [userLogdin, connected]);

    const fetchLogdin = async () => {
        console.log('fetchLogdin');
        const getCurrentUser = await (await fetch('/api/login/islogdin')).json();
        console.log({ getCurrentUser });
        if (getCurrentUser.user) {
            setUserLogdin(getCurrentUser.user);
            return;
        }
        setUserLogdin(false);
    };

    return (
        <UserLogdinContext.Provider value={{ userLogdin, setUserLogdin }}>
            {children}
        </UserLogdinContext.Provider>
    );
}

export function useUserLogdinContext() {
    return useContext(UserLogdinContext);
}
