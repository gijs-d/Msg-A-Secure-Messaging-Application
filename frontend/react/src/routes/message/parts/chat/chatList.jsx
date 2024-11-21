import React, { useState, useEffect } from 'react';
import { socket } from '../../../../socket';

import MessageElem from './messageElem';

import arrowDown from '../../../../assets/media/arrow-down.png';

export default function ChatList({
    selectedFriend,
    newFriendMessage,
    deletedFriendMessage,
    messagesRef,
    setReplyMessage,
    scrollToBottom,
    setScrollToBottom,
    scrollDownBtnRef,
}) {
    const [loadMoreMsg, setLoadMoreMsg] = useState(false);
    const [friendMessages, setFriendMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [scrolling, setScrolling] = useState(false);
    const [scrollingTimeout, setScrollingTimeout] = useState(null);
    const [friendTyping, setFriendTyping] = useState(false);
    const [newTypeMsg, setNewTypeMsg] = useState({});
    const [visibility, setVisibility] = useState(true);
    const [scrollDownButtonVisibility, setScrollDownButtonVisibility] = useState(0);

    useEffect(() => {
        if (!newTypeMsg.user) {
            return;
        }
        if (newTypeMsg.user != selectedFriend.id) {
            return;
        }
        setFriendTyping(newTypeMsg.state);
    }, [newTypeMsg, selectedFriend]);

    useEffect(() => {
        if (!loadMoreMsg) {
            return;
        }
        setScrolling(true);
        loadMessages(false);
        clearTimeout(scrollingTimeout);
        setScrollingTimeout(setTimeout(() => setScrolling(false), 5000));
    }, [loadMoreMsg]);

    useEffect(() => {
        const typingMsg = msg => {
            if (!msg.user || !'state' in msg) {
                return;
            }
            setNewTypeMsg(msg);
        };
        const visibilitychange = () => {
            setVisibility(document.visibilityState == 'visible');
        };
        socket.on('typing', typingMsg);
        document.addEventListener('visibilitychange', visibilitychange);
        return () => {
            socket.off('typing', typingMsg);
            document.removeEventListener('visibilitychange', visibilitychange);
        };
    }, []);

    useEffect(() => {
        if (!visibility) {
            return;
        }
        if (!newFriendMessage?.from || !selectedFriend?.id) {
            return;
        }
        if (newFriendMessage.from != selectedFriend.id) {
            return;
        }
        socket.emit('readMsg', { id: newFriendMessage._id, from: newFriendMessage.from });
    }, [visibility]);

    useEffect(() => {
        const elem = messagesRef.current;
        elem.addEventListener('scroll', handleScroll);
        return () => elem.removeEventListener('scroll', handleScroll);
    }, [isLoading]);

    useEffect(() => {
        setFriendTyping(false);
        setFriendMessages([]);
        setReplyMessage(null);

        if (!selectedFriend.id) {
            return;
        }
        loadMessages(true);
        setScrollToBottom(true);
    }, [selectedFriend]);

    useEffect(() => {
        if (scrollDownButtonVisibility == 0) {
            return;
        }
        const elem = messagesRef.current;
        elem.addEventListener('scroll', closeScrollBtn);
        return () => elem.removeEventListener('scroll', closeScrollBtn);
    }, [scrollDownButtonVisibility]);

    useEffect(() => {
        if (!newFriendMessage.from) {
            return;
        }
        setFriendMessages([newFriendMessage, ...friendMessages]);
        if (newFriendMessage.from == selectedFriend.id) {
            if (document.visibilityState == 'visible') {
                socket.emit('readMsg', { id: newFriendMessage._id, from: newFriendMessage.from });
            }
        }
        scrollIfAtBottom();
    }, [newFriendMessage]);

    useEffect(() => {
        if (!deletedFriendMessage.from) {
            return;
        }
        const messages = [...friendMessages];
        const removed = messages.find(m => m._id == deletedFriendMessage.message);
        if (removed) {
            setFriendMessages(messages.filter(m => m._id != deletedFriendMessage.message));
        }
    }, [deletedFriendMessage]);

    useEffect(() => {
        if (scrollToBottom && messagesRef && !scrolling) {
            messagesRef.current.scroll(0, 0);
            setScrollDownButtonVisibility(0);
        }
        setScrollToBottom(false);
    }, [scrollToBottom]);

    const handleScroll = () => {
        if (
            messagesRef.current?.scrollHeight + messagesRef.current?.scrollTop - 250 >
                messagesRef.current?.offsetHeight ||
            isLoading
        ) {
            return;
        }

        setLoadMoreMsg(true);
    };

    const closeScrollBtn = e => {
        if (messagesRef.current.scrollTop + 100 > 0) {
            setScrollDownButtonVisibility(0);
        }
    };

    const scrollIfAtBottom = () => {
        const scrollDistanceBottom =
            messagesRef.current.scrollHeight - messagesRef.current.offsetHeight;
        if (newFriendMessage.to == selectedFriend.id || messagesRef.current.scrollTop + 100 > 0) {
            setScrollToBottom(true);
        }
        if (messagesRef.current.scrollTop + 100 < 0) {
            setScrollDownButtonVisibility(scrollDownButtonVisibility + 1);
        }
    };

    const loadMessages = async first => {
        setIsLoading(true);
        let since = '';
        if (friendMessages.length > 0 && !first) {
            since = friendMessages[friendMessages.length - 1].createdAt;
        }
        const oldMessages = await (
            await fetch('/api/message/from', {
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedFriend.id, since }),
            })
        ).json();
        if (oldMessages.messages && oldMessages.messages.length > 0) {
            if (first) {
                setFriendMessages(oldMessages.messages); //.reverse());
                setScrollToBottom(true);
            } else {
                setFriendMessages([...friendMessages, ...oldMessages.messages]); //.reverse());
            }
            setIsLoading(false);
        }
        setLoadMoreMsg(false);
    };
    return (
        <ul ref={messagesRef} className="chatList">
            <li className="message" style={{ display: friendTyping > 0 ? 'block' : 'none' }}>
                <p id="friendTyping">{selectedFriend.username} is typing...</p>
            </li>
            {friendMessages.length > 0 &&
                friendMessages.map(m => (
                    <MessageElem
                        m={m}
                        key={`message-${m._id}`}
                        selectedFriend={selectedFriend}
                        setScrollToBottom={setScrollToBottom}
                        setReplyMessage={setReplyMessage}
                    />
                ))}
            <span></span>
            <div ref={scrollDownBtnRef} className="chatListBottom">
                <input
                    id="scrollToBotomBtn"
                    type="button"
                    onClick={() => {
                        setScrolling(false);
                        setScrollToBottom(true);
                    }}
                    value={scrollDownButtonVisibility}
                    style={{
                        backgroundImage: `url(${arrowDown})`,
                        display: scrollDownButtonVisibility > 0 ? 'block' : 'none',
                    }}
                />
            </div>
        </ul>
    );
}
