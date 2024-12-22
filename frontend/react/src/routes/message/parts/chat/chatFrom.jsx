import React, { useState, useEffect } from 'react';
import e2e from '../../../../lib/e2e';
import { socket } from '../../../../lib/socket';

import InputForm from './inputForm';

export default function ChatForm({
    chatRef,
    selectedFriend,
    setScrollToBottom,
    replyMessage,
    setReplyMessage,
    messagesRef,
    formRef,
    inputRef,
    scrollDownBtnRef,
}) {
    const [message, setMessage] = useState('');
    const [typing, setTyping] = useState(-1);
    const [typeTimeout, setTypeTimeout] = useState(null);
    const [fileInput, setFileInput] = useState(false);
    const [lastInput, setLastInput] = useState({ reply: false, file: false });
    useEffect(() => {
        if (typing < 0 || !selectedFriend.id) {
            return;
        }
        socket.emit('typing', { to: selectedFriend.id, state: typing });
    }, [typing]);
    useEffect(() => {
        let [reply, file] = [!!replyMessage, !!fileInput];
        if (reply && file) {
            if (lastInput.file) {
                file = undefined;
                setFileInput(file);
                if (fileInput.src) {
                    URL.revokeObjectURL(fileInput.src);
                }
            } else if (lastInput.reply) {
                reply = undefined;
                setReplyMessage(reply);
            } else {
                reply = undefined;
                setReplyMessage(reply);
            }
        }
        setLastInput({ reply, file });
    }, [replyMessage, fileInput]);
    useEffect(() => {
        if (!inputRef || !chatRef) {
            return;
        }
        inputRef.current.style.height = '50px';

        let height = inputRef.current.scrollHeight;
        const totalHeight = chatRef.current.offsetHeight - 50;
        const extraHeight = (replyMessage ? 50 : 0) + (fileInput ? 100 : 0);
        const minListHeight = 150;
        let listHeight = minListHeight;
        if (totalHeight * 0.4 > listHeight) {
            listHeight = Math.floor(totalHeight * 0.4);
        }
        if (height < 50) {
            height = 50;
        }
        if (height + extraHeight + listHeight >= totalHeight) {
            if (50 + extraHeight + minListHeight >= totalHeight) {
                height = 50;
            } else {
                height = totalHeight - (extraHeight + listHeight);
            }
        } else {
            listHeight = totalHeight - height - extraHeight;
        }
        inputRef.current.style.height = `${height}px`;
        formRef.current.style.height = `${height + extraHeight}px`;
        scrollDownBtnRef.current.style.bottom = `${height + extraHeight}px`;
        messagesRef.current.style.height = `calc(100% - ${height + extraHeight + 50}px)`;
        if (message == '' && !replyMessage) {
            setTyping(0);
            return;
        }
        setTyping(1);
        clearTimeout(typeTimeout);
        setTypeTimeout(setTimeout(() => setTyping(0), 3000));
    }, [message, replyMessage, fileInput]);

    const sendMesage = async e => {
        e.preventDefault();
        if (inputRef) {
            inputRef.current.focus();
        }
        setTyping(0);
        setMessage('');
        setReplyMessage(null);
        setFileInput(undefined);
        if ((message || fileInput) && selectedFriend.id) {
            let sendmsg = e2e.encryptMessage(message, selectedFriend.dkeys);
            if (message == '') {
                sendmsg = e2e.encryptMessage(' ', selectedFriend.dkeys);
            }
            const msg = {
                to: selectedFriend.id,
                type: 'text',
                msg: sendmsg.msg,
            };
            if (replyMessage) {
                msg.type = 'reply';
                msg['reply'] = replyMessage;
            }
            if (fileInput) {
                msg.type = 'img';
                msg['ext'] = fileInput.ext;
                msg['filetype'] = fileInput.filetype;
                msg['src'] = fileInput.file;
                URL.revokeObjectURL(fileInput.src);
            }
            socket.emit('msg', msg);
        }

        setScrollToBottom(true);
    };

    const showMessage = msg => {
        const text = e2e.decryptMessage(msg, selectedFriend.dkeys);
        return text.msg;
    };

    return (
        <form onSubmit={sendMesage} className="chatForm" ref={formRef}>
            {fileInput && (
                <div className="inputfile">
                    <figure>
                        <img src={fileInput?.src}></img>
                    </figure>
                    <input
                        type="button"
                        value="X"
                        onClick={() => {
                            setFileInput(undefined);
                            if (fileInput.src) {
                                URL.revokeObjectURL(fileInput.src);
                            }
                        }}
                    />
                </div>
            )}
            {replyMessage && (
                <div className="reply">
                    <p>
                        Reply to: {replyMessage.from == selectedFriend.id ? '' : 'U: '}
                        {showMessage(replyMessage.msg)}
                    </p>
                    <input type="button" value="X" onClick={() => setReplyMessage(undefined)} />
                </div>
            )}
            <InputForm
                {...{
                    message,
                    setMessage,
                    selectedFriend,
                    replyMessage,
                    inputRef,
                    formRef,
                    fileInput,
                    setFileInput,
                }}
            />
        </form>
    );
}
