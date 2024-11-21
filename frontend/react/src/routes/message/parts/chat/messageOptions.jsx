import React, { useState } from 'react';

export default function MessageOptions({ m, newmsg, selectedFriend, setReplyMessage }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteMenu, setDeleteMenu] = useState(false);

    const send = m.to == selectedFriend.id;

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const tryDelete = () => {
        setDeleteMenu(true);
        closeMenu();
    };

    const cancelDelete = () => {
        setDeleteMenu(false);
    };

    const deleteMsg = async () => {
        fetch('/api/message', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: m._id }),
        });
        setDeleteMenu(false);
    };

    const replyMsg = () => {
        const { _id, from, to, msg, type } = m;
        setReplyMessage({ id: _id, from, to, msg: type == 'img' ? 'image' : msg });
        closeMenu();
    };

    const copyMsg = () => {
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(newmsg.msg);
        } else if (typeof AndroidMain != 'undefined') {
            AndroidMain.copyToClipboard(newmsg.msg);
        }
        closeMenu();
    };

    const showMenu = e => {
        if (deleteMenu) {
            return;
        }
        setMenuOpen(true);
        e.target.parentNode.addEventListener(
            'mouseleave',
            () => {
                setMenuOpen(false);
            },
            { once: true }
        );
    };

    return (
        <div className="messageOptions">
            <input type="button" value="°°°" className="messageMenuBtn" onMouseOver={showMenu} />
            <ul className="messageOptionsMenu" style={{ display: menuOpen ? 'block' : 'none' }}>
                <li onClick={replyMsg}>Reply</li>
                {m.type !== 'img' && <li onClick={copyMsg}>Copy</li>}
                {send && <li onClick={tryDelete}>Delete</li>}
            </ul>
            <div
                className="confirmDelete messageOptionsMenu"
                style={{ display: deleteMenu ? 'block' : 'none' }}
            >
                <p>Confirm delete?</p>
                <form>
                    <input type="button" value="yes" onClick={deleteMsg} />
                    <input type="button" value="no" onClick={cancelDelete} />
                </form>
            </div>
        </div>
    );
}
