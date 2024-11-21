import React, { useState, useEffect, useRef } from 'react';
import e2e from '../../../../lib/e2e';

import lockOpen from '../../../../assets/media/lock-open.png';
import lockClosed from '../../../../assets/media/lock-closed.png';

export default function FriendBarElem({ friendship, openConversation }) {
    let newmsg;
    let unread = '';

    if (friendship.lastMessage) {
        newmsg = e2e.decryptMessage(friendship.lastMessage.msg, e2e.deriveKeys(friendship.keys));
        if (!friendship.lastMessage.send) {
            unread = friendship.lastMessage.read ? '' : 'unread';
        }
    }
    return (
        <li
            key={friendship._id}
            id={`${friendship._id}`}
            onClick={openConversation}
            className={unread}
        >
            <h3> {friendship.username}</h3>
            {friendship.lastMessage ? (
                <>
                    {friendship.lastMessage.type === 'text' ||
                    friendship.lastMessage.type === 'reply' ? (
                        <>
                            <figure className="lock">
                                <img src={newmsg.encrypted ? lockClosed : lockOpen} />
                            </figure>
                            <p>
                                {friendship.lastMessage.send && 'u: '}
                                {newmsg.msg}
                            </p>
                        </>
                    ) : (
                        <>
                            <p>
                                {friendship.lastMessage.send && 'u: '}
                                {'Image'}
                            </p>
                        </>
                    )}
                </>
            ) : (
                <p>Send message</p>
            )}
        </li>
    );
}
