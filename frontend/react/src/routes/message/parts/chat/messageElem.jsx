import React, { useState } from 'react';
import e2e from '../../../../lib/e2e';

import ImgMsg from './imgMsg';
import lockOpen from '../../../../assets/media/lock-open.png';
import lockClosed from '../../../../assets/media/lock-closed.png';

import MessageOptions from './messageOptions';

export default function MessageElem({ m, selectedFriend, setScrollToBottom, setReplyMessage }) {
    const [showPlain, setShowPlain] = useState(false);
    let replymsg;
    let newmsg;
    let url;
    let yt;
    if (m.type == 'reply') {
        replymsg = e2e.decryptMessage(m.reply.msg, selectedFriend.dkeys);
    }
    if (m.type != 'img') {
        newmsg = e2e.decryptMessage(m.msg, selectedFriend.dkeys);
        try {
            url = new URL(newmsg.msg);
            if (url.host.includes('youtube')) {
                const id = newmsg.msg
                    .split('?')[1]
                    .split('&')
                    .filter(f => f.includes('v='))[0]
                    .split('v=')[1];
                yt = `https://www.youtube.com/embed/${id}`;
            }
        } catch {
            /* empty */
        }
    }
    const localtime = new Date(m.createdAt).toLocaleString();
    const send = m.to == selectedFriend.id;
    let startPoint = { x: null, y: null };

    const goTo = () => {
        const selected = document.querySelector('.chatList #id' + m.reply.id);
        if (selected) {
            selected.scrollIntoView();
            document.querySelectorAll('.replyRef').forEach(d => d.classList.remove('replyRef'));
            selected.classList.add('replyRef');
        }
    };

    const touchStart = e => {
        startPoint = {
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY,
        };
    };

    const mouseDown = e => {
        startPoint = {
            x: e.clientX,
            y: e.clientY,
        };
    };

    const mouseUp = e => {
        const endPoint = {
            x: e.clientX,
            y: e.clientY,
        };
        checkSwipe(endPoint);
    };

    const touchEnd = e => {
        const endPoint = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
        };
        checkSwipe(endPoint);
    };

    const checkSwipe = endPoint => {
        const x = Math.abs(startPoint.x - endPoint.x);
        const y = Math.abs(startPoint.y - endPoint.y);
        startPoint = { x: null, y: null };
        if (x > 50 && y < 50) {
            const { _id, from, to, msg, type } = m;
            setReplyMessage({ id: _id, from, to, msg: type == 'img' ? 'image' : msg });
        }
    };

    const toggleShowPlain = e => {
        if (!newmsg.encrypted || url) {
            return;
        }
        setShowPlain(!showPlain);
    };

    return (
        <li
            key={m._id}
            id={'id' + m._id}
            onTouchStart={touchStart}
            onTouchEnd={touchEnd}
            onMouseDown={mouseDown}
            onMouseUp={mouseUp}
            className={'message' + (send ? ' send' : ' received')}
        >
            <MessageOptions {...{ m, newmsg, selectedFriend, setReplyMessage }} />
            {m.type == 'reply' && (
                <div className="replyMsg" onClick={goTo}>
                    <p>
                        {m.reply.to == selectedFriend.id ? 'u: ' : ''}
                        {replymsg.msg}
                    </p>
                </div>
            )}
            {yt && (
                <div className="msgIframe">
                    <iframe src={yt}></iframe>
                </div>
            )}
            <div className="msg">
                {m.type == 'img' ? (
                    <ImgMsg {...{ m, selectedFriend, setScrollToBottom }} />
                ) : (
                    <>
                        {send ? (
                            <>
                                <figure className="lock" onClick={toggleShowPlain}>
                                    <img
                                        src={newmsg.encrypted && !showPlain ? lockClosed : lockOpen}
                                    />
                                </figure>
                                <p
                                    className="decodeText"
                                    style={{ display: showPlain ? 'none' : 'block' }}
                                >
                                    {url ? (
                                        <a href={url} target="_blank" rel="noreferrer">
                                            {newmsg.msg}
                                        </a>
                                    ) : (
                                        newmsg.msg
                                    )}
                                </p>
                                {!url && (
                                    <p
                                        className="plainText"
                                        style={{ display: showPlain ? 'block' : 'none' }}
                                    >
                                        {m.msg}
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                <p
                                    className="decodeText"
                                    style={{ display: showPlain ? 'none' : 'block' }}
                                >
                                    {url ? (
                                        <a href={url} target="_blank" rel="noreferrer">
                                            {newmsg.msg}
                                        </a>
                                    ) : (
                                        newmsg.msg
                                    )}
                                </p>
                                {!url && (
                                    <p
                                        className="plainText"
                                        style={{ display: showPlain ? 'block' : 'none' }}
                                    >
                                        {m.msg}
                                    </p>
                                )}

                                <figure className="lock" onClick={toggleShowPlain}>
                                    <img
                                        src={newmsg.encrypted && !showPlain ? lockClosed : lockOpen}
                                    />
                                </figure>
                            </>
                        )}
                    </>
                )}
            </div>
            <p className="msgTime">{localtime}</p>
        </li>
    );
}
