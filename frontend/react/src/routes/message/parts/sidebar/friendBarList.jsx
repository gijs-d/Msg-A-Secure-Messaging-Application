import React, { useState, useEffect } from 'react';
import e2e from '../../../../lib/e2e';

import FriendBarElem from './friendBarElem';
import { contexts } from '../../../../providers';
const { useUserLogdinContext } = contexts;

export default function FriendBarList({
    selectedFriend,
    setSelectedFriend,
    newMessage,
    displaySettings,
    setDisplaySettings,
    deletedMessage,
}) {
    const [friendBar, setFriendBar] = useState([]);
    const { userLogdin, setUserLogdin } = useUserLogdinContext();

    useEffect(() => {
        loadFriendBar();
    }, []);

    useEffect(() => {
        if (!deletedMessage.from) {
            return;
        }
        const bar = [...friendBar];
        const friend = bar.find(f => f.lastMessage?._id == deletedMessage.message);
        if (friend) {
            friend.lastMessage = undefined;
            setFriendBar(bar);
        }
    }, [deletedMessage]);

    useEffect(() => {
        if (!newMessage.from) {
            return;
        }
        updateFriendBar();
    }, [newMessage]);

    const updateFriendBar = () => {
        let isRead = false;
        if (newMessage.from == selectedFriend.id || newMessage.to == selectedFriend.id) {
            isRead = true;
        }
        let newFriendBar = [...friendBar];
        let oldfriend = newFriendBar.find(
            f => f._id != userLogdin && (f._id === newMessage.from || f._id === newMessage.to)
        );
        if (!oldfriend) {
            oldfriend = newFriendBar.find(
                f => f._id === newMessage.from && f._id === newMessage.to
            );
        }
        if (!oldfriend) {
            return;
        }
        const { _id, msg, read, type, createdAt } = newMessage;
        oldfriend.lastMessage = {
            _id,
            msg,
            read: isRead ? isRead : read,
            type,
            createdAt,
            send: oldfriend._id == newMessage.to,
        };
        oldfriend.time = createdAt;
        newFriendBar = newFriendBar.sort((a, b) => (a.time > b.time ? -1 : 1));
        setFriendBar(newFriendBar);
        if (typeof AndroidMain !== 'undefined') {
            localStorage.setItem('androidCache', JSON.stringify(newFriendBar));
        }
    };

    const loadFriendBar = async () => {
        const result = await (await fetch('/api/message/friendbar')).json();
        if (!result.friendBar) {
            return;
        }
        if (typeof AndroidMain !== 'undefined') {
            const offline = AndroidMain.isOffline();
            if (offline) {
                let cached = localStorage.getItem('androidCache');
                if (cached) {
                    cached = JSON.parse(cached);
                    if (cached[0].time > result.friendBar[0].time) {
                        result.friendBar = cached;
                    }
                }
            }
        }
        setFriendBar(result.friendBar);
        e2e.loadKeys(result.user);
    };

    const openConversation = async e => {
        const elem = e.target.closest('li');
        const id = elem.id;
        const friend = friendBar.find(f => f._id === id);
        setSelectedFriend({
            id,
            username: friend.username,
            dkeys: e2e.deriveKeys(friend.keys),
        });
        setDisplaySettings({ ...displaySettings, friendBar: false });
        if (friend.lastMessage && !friend.lastMessage.read) {
            friend.lastMessage.read = true;
        }
    };
    return (
        <ul
            className="friendList"
            style={{ height: !displaySettings.showBoth ? '100%' : 'calc( 100% - 50px)' }}
        >
            {friendBar.length > 0 ? (
                friendBar.map(friendship => (
                    <FriendBarElem
                        friendship={friendship}
                        key={`friend-${friendship._id}`}
                        openConversation={openConversation}
                    />
                ))
            ) : (
                <h4>No friends to chat with</h4>
            )}
        </ul>
    );
}
