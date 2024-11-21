import React, { useState, useRef } from 'react';

import ChatHeader from './chat/chatHeader';
import ChatForm from './chat/chatFrom';
import ChatList from './chat/chatList';

export default function Chat({
    selectedFriend,
    newFriendMessage,
    displaySettings,
    setDisplaySettings,
    deletedFriendMessage,
}) {
    const [scrollToBottom, setScrollToBottom] = useState(false);
    const [replyMessage, setReplyMessage] = useState(null);
    const messagesRef = useRef(null);
    const formRef = useRef(null);
    const inputRef = useRef(null);
    const chatRef = useRef(null);
    const scrollDownBtnRef = useRef(null);
    return (
        <section
            ref={chatRef}
            className={
                'chat' + (!displaySettings.showBoth && displaySettings.friendBar ? ' closed' : '')
            }
        >
            <ChatHeader {...{ selectedFriend, displaySettings, setDisplaySettings }} />
            <ChatList
                {...{
                    selectedFriend,
                    newFriendMessage,
                    deletedFriendMessage,
                    messagesRef,
                    setReplyMessage,
                    scrollToBottom,
                    setScrollToBottom,
                    scrollDownBtnRef,
                }}
            />
            <ChatForm
                {...{
                    selectedFriend,
                    setScrollToBottom,
                    replyMessage,
                    setReplyMessage,
                    messagesRef,
                    formRef,
                    inputRef,
                    scrollDownBtnRef,
                    chatRef,
                }}
            />
        </section>
    );
}
