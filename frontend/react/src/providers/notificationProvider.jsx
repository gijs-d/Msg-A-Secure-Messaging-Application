import React, { createContext, useContext, useState, useEffect } from 'react';

import { socket } from '../lib/socket';

import { useUserLogdinContext } from './userLogdinProvider';
const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const { userLogdin } = useUserLogdinContext();
    const [notifications, setNotifications] = useState(false);

    useEffect(() => {
        getNotifications();
        const handleMessage = msg => {
            const data = msg.data;
            if (data.token) {
                sendToken(data.token);
            }
            if (data.reload) {
                getLastMsg(data.reload);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    useEffect(() => {
        if (!userLogdin || !notifications) {
            return;
        }
        const newMsg = async msg => newNotification(msg);
        socket.on('newMsg', newMsg);
        return () => {
            socket.off('newMsg', newMsg);
        };
    }, [userLogdin, notifications]);

    const newNotification = async message => {
        if (typeof AndroidPush !== 'undefined') {
            localStorage.setItem('lastMessage', message?.createdAt);
        }
        if (document.visibilityState == 'visible' && !androidBackground) {
            return;
        }
        const { fromUsername, keys, msg } = message;
        const { title, body } = getMsgTitleAndBody(fromUsername, msg, keys);
        if (typeof AndroidPush !== 'undefined') {
            AndroidPush.newMsg(title, body);
        } else if (typeof Notification !== 'undefined') {
            const ok = await Notification.requestPermission();
            if (ok === 'granted') {
                new Notification(title, {
                    body,
                    icon: logo,
                });
            }
        }
    };

    const getMsgTitleAndBody = (fromUsername, msg, keys, user) => {
        let hasKeys = e2e.checkKeys();
        if (!hasKeys && (userLogdin || user)) {
            hasKeys = e2e.loadKeys(userLogdin || user);
        }
        const title = fromUsername;
        let body = 'send a msg';
        if (hasKeys && keys?.length == 2) {
            body = e2e.decryptMessage(msg, e2e.deriveKeys(keys)).msg;
        }
        return { title, body };
    };
    const getLastMsg = async createdAt => {
        setAndroidBackground(true);
        const lastMessage = localStorage.getItem('lastMessage');
        if (lastMessage && lastMessage >= createdAt) {
            return;
        }
        localStorage.setItem('lastMessage', createdAt);
        const res = await (
            await fetch('/api/message/last', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ createdAt }),
            })
        ).json();
        if (!res.lastMsg) {
            return;
        }
        const { user } = res;
        const { fromUsername, msg, keys } = res.lastMsg;
        const { title, body } = getMsgTitleAndBody(fromUsername, msg, keys, user);
        if (typeof AndroidPush !== 'undefined') {
            AndroidPush.newMsg(title, body);
        }
    };
    const getNotifications = () => {
        const savedNotifications = localStorage.getItem('notifications');
        if (savedNotifications == 'true') {
            setNotifications(true);
        }
    };
    return (
        <NotificationContext.Provider value={{ notifications, setNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext() {
    return useContext(NotificationContext);
}
