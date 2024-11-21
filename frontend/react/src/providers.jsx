import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useLayoutEffect,
    useRef,
} from 'react';

import { socket } from './socket';
import logo from '../public/icon.png';
import e2e from './lib/e2e';

const ThemeContext = createContext(null);
const UserLogdinContext = createContext(null);
const NotificationContext = createContext(null);
const CallContext = createContext(null);

export function Providers({ children }) {
    const [userLogdin, setUserLogdin] = useState(undefined);
    const [theme, setTheme] = useState(false);
    const [notifications, setNotifications] = useState(false);
    const [heartbeatTimeout, setHeartbeatTimeout] = useState(false);

    const [androidBackground, setAndroidBackground] = useState(false);

    const [connected, setConnected] = useState(socket.connected);
    const [calling, setCalling] = useState({
        caller: true,
        active: false,
        status: false,
        username: 'gg',
        type: 'video',
        id: '660223b72f436c62266ab6dc',
        start: 0,
    });
    const [incommingCall, setIncommingCall] = useState();
    const timeout = useRef(null);

    useEffect(() => {
        if (!userLogdin && connected) {
            socket.disconnect();
            return;
        }
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        if (userLogdin && !connected) {
            socket.connect();
        }
        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, [userLogdin, connected]);

    useEffect(() => {
        if (!incommingCall) {
            return;
        }
        const { msg } = incommingCall;
        if (incommingCall.call) {
            if (calling.status) {
                //socket.emit('endCall', { id: msg.id });
                return;
            }

            if (incommingCall.caller) {
                setCalling({
                    caller: true,
                    active: false,
                    status: 'calling',
                    username: msg.username2,
                    type: msg.type,
                    id: msg.user2,
                    peerid: msg.peerid,
                    start: 0,
                });
            } else {
                setCalling({
                    caller: false,
                    active: false,
                    status: 'calling',
                    username: msg.username,
                    type: msg.type,
                    id: msg.user,
                    peerid: msg.peerid,
                    start: 0,
                });
            }
            const { user, type } = msg;
        } else {
            if (calling.id) {
                socket.emit('endCall', { id: calling.id });
            }
            setCalling({
                active: false,
                status: false,
                username: '',
                type: '',
                id: '',
                start: 0,
            });
        }
    }, [incommingCall]);

    useEffect(() => {
        if (!userLogdin) {
            return;
        }
        const endCall = msg => {
            clearTimeout(timeout.current);
            setIncommingCall({
                msg,
                call: false,
            });
        };

        const onCalling = msg => {
            setIncommingCall({
                msg,
                call: true,
            });
        };
        const updateTimeout = () => {
            clearTimeout(timeout.current);
            timeout.current = setTimeout(() => {
                endCall();
                console.log('timeout');
            }, 20000);
        };

        socket.on('calling', onCalling);
        socket.on('callEnd', endCall);
        socket.on('pingCall', updateTimeout);
        return () => {
            socket.off('calling', onCalling);
            socket.off('callEnd', endCall);
            socket.off('pingCall', updateTimeout);
        };
    }, [userLogdin]);

    const onConnect = () => {
        setConnected(true);
    };

    const onDisconnect = () => {
        setConnected(false);
    };

    useEffect(() => {
        fetchLogdin();
        getTheme();
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

    const sendToken = async token => {
        fetch('/api/account/androidId', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ androidId: token }),
        });
    };

    useLayoutEffect(() => {
        changeTheme();
    }, [theme]);

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

    const getNotifications = () => {
        const savedNotifications = localStorage.getItem('notifications');
        if (savedNotifications == 'true') {
            setNotifications(true);
        }
    };

    const changeTheme = () => {
        const root = document.querySelector(':root');
        const tempTheme = theme;

        if (tempTheme !== 'light' && tempTheme !== 'dark') {
            try {
                const prefTheme = window?.matchMedia('(prefers-color-scheme: dark)')?.matches
                    ? 'dark'
                    : 'light';
                setTheme(prefTheme);
            } catch {
                setTheme('light');
            }
            return;
        }
        root.style.setProperty('color-scheme', theme);
        const sets = [
            'body-bg',
            'body-color',
            'body-txt',
            'header-icon-bg',
            'hover-bg',
            'hover-txt',
            'a-txt',
            'l-opaque',
            'll-opaque',
            'lll-opaque',
            'h-opaque',
            'bg-opaque',
            'input-bg',
            'input-txt',
            'shadow',
            'icon-invert',
        ];
        sets.forEach(s => {
            const color = getComputedStyle(root).getPropertyValue(`--${theme}-${s}`);
            root.style.setProperty(`--${s}`, color);
        });
    };

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

    const getTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            if (savedTheme !== 'light' && savedTheme !== 'dark') {
                return;
            }
            setTheme(savedTheme);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <UserLogdinContext.Provider value={{ userLogdin, setUserLogdin }}>
                <NotificationContext.Provider value={{ notifications, setNotifications }}>
                    <CallContext.Provider value={{ calling, setCalling }}>
                        {children}
                    </CallContext.Provider>
                </NotificationContext.Provider>
            </UserLogdinContext.Provider>
        </ThemeContext.Provider>
    );
}
export function useCallContext() {
    return useContext(CallContext);
}
export function useThemeContext() {
    return useContext(ThemeContext);
}

export function useUserLogdinContext() {
    return useContext(UserLogdinContext);
}

export function useNotificationContext() {
    return useContext(NotificationContext);
}
