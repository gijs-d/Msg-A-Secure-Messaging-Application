import React, { useState, useEffect } from 'react';
import { socket } from '../../lib/socket';
import e2e from '../../lib/e2e';

import Chat from './parts/chat';
import Sidebar from './parts/sidebar';

import { contexts } from '../../providers';
const { useUserLogdinContext } = contexts;

export default function Message() {
    const { userLogdin, setUserLogdin } = useUserLogdinContext();

    const [selectedFriend, setSelectedFriend] = useState({
        id: '',
        username: 'Select user',
        dkeys: [],
    });
    const [newMessage, setNewMessage] = useState({});
    const [newFriendMessage, setNewFriendMessage] = useState({});

    const [deletedMessage, setDeletedMessage] = useState({});
    const [deletedFriendMessage, setDeletedFriendMessage] = useState({});
    const [noKeys, setNoKeys] = useState(true);

    let savedSettings = localStorage.getItem('displaySettings');
    let settings = { showBoth: true, friendBar: true };

    if (savedSettings) {
        savedSettings = JSON.parse(savedSettings);
        if ('showBoth' in savedSettings && 'friendBar' in savedSettings) {
            settings = savedSettings;
        }
    }

    const [displaySettings, setDisplaySettings] = useState(settings);

    useEffect(() => {
        const { showBoth, friendBar } = displaySettings;
        if (!showBoth && !friendBar) {
            if (!selectedFriend.id) {
                setDisplaySettings({ showBoth, friendBar: true });
            }
        }
        if (!showBoth && friendBar) {
            if (selectedFriend.id) {
                setSelectedFriend({ id: '', username: 'Select user', dkeys: [] });
            }
        }
        localStorage.setItem('displaySettings', JSON.stringify(displaySettings));
    }, [displaySettings]);

    useEffect(() => {
        setNoKeys(!e2e.hasKeys(userLogdin) ? 2 : 1);
        const newMsg = msg => {
            setNewMessage(msg);
        };
        const deleteMessage = msg => {
            setDeletedMessage(msg);
        };
        socket.on('msg', newMsg);
        socket.on('deleteMessage', deleteMessage);
        return () => {
            socket.off('msg', newMsg);
            socket.off('deleteMessage', deleteMessage);
        };
    }, []);

    useEffect(() => {
        if (deletedMessage.from != userLogdin && deletedMessage.from != selectedFriend.id) {
            return;
        }
        setDeletedFriendMessage(deletedMessage);
    }, [deletedMessage]);

    useEffect(() => {
        if (!newMessage.from) {
            return;
        }
        if (selectedFriend.id == userLogdin) {
            if (newMessage.from == newMessage.to && newMessage.from == selectedFriend.id) {
                setNewFriendMessage(newMessage);
            }
        } else {
            if (newMessage.from == selectedFriend.id || newMessage.to == selectedFriend.id) {
                setNewFriendMessage(newMessage);
            }
        }
    }, [newMessage]);

    return (
        <>
            {noKeys > 1 && (
                <p id="warnMsg">
                    No keys yet.<a href="/settings">Create or enter here.</a>
                </p>
            )}
            <Sidebar
                {...{
                    selectedFriend,
                    setSelectedFriend,
                    newMessage,
                    displaySettings,
                    setDisplaySettings,
                    deletedMessage,
                }}
            />
            <Chat
                {...{
                    selectedFriend,
                    newFriendMessage,
                    displaySettings,
                    setDisplaySettings,
                    deletedFriendMessage,
                }}
            />
        </>
    );
}
