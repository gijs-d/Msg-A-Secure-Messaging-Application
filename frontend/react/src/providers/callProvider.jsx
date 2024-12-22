import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

import { socket } from '../lib/socket';

import { useUserLogdinContext } from './userLogdinProvider';
const CallContext = createContext(null);

export function CallProvider({ children }) {
    const { userLogdin } = useUserLogdinContext();
    const [incommingCall, setIncommingCall] = useState();
    const callTimeout = useRef(null);
    const [calling, setCalling] = useState({
        caller: true,
        active: false,
        status: false,
        username: 'gg',
        type: 'video',
        id: '660223b72f436c62266ab6dc',
        start: 0,
    });
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
            clearTimeout(callTimeout.current);
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
            clearTimeout(callTimeout.current);
            callTimeout.current = setTimeout(() => {
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

    return <CallContext.Provider value={{ calling, setCalling }}>{children}</CallContext.Provider>;
}

export function useCallContext() {
    return useContext(CallContext);
}
