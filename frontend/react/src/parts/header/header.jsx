import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { socket } from '../../lib/socket';

import iconAccount from '../../assets/media/icon-account.png';
import iconMessage from '../../assets/media/icon-message.png';
import iconSettings from '../../assets/media/icon-settings.png';
import Searchbar from './searchbar';

import icon from '../../../public/icon.png';
import '../../assets/css/parts/header.css';

import { contexts } from '../../providers';
const { useUserLogdinContext } = contexts;

export default function Header() {
    const { userLogdin } = useUserLogdinContext();
    const [requests, setRequests] = useState([]);
    const [messages, setMessages] = useState([]);
    const [update, setUpdate] = useState({ type: '', add: false, id: '' });

    useEffect(() => {
        if (!userLogdin) {
            return;
        }
        fetchMessages();
        fetchRequests();

        const newMsg = async msg => setUpdate({ type: 'msg', add: true, id: msg.from });
        const readMsg = async msg => setUpdate({ type: 'msg', add: false, id: msg.from });
        const newRequest = async msg => setUpdate({ type: 'requests', add: true, id: msg.from });
        const deleteRequest = async msg =>
            setUpdate({ type: 'requests', add: false, id: msg.from });
        const confirmRequest = async msg =>
            setUpdate({ type: 'requests', add: false, id: msg.from });
        const socketHandlers = [
            ['newMsg', newMsg],
            ['readMsg', readMsg],
            ['newRequest', newRequest],
            ['deleteRequest', deleteRequest],
            ['confirmRequest', confirmRequest],
        ];
        socketHandlers.forEach(s => socket.on(s[0], s[1]));

        return () => {
            socketHandlers.forEach(s => socket.off(s[0], s[1]));
        };
    }, [userLogdin]);

    useEffect(() => {
        if (!update.type) {
            return;
        }
        handelUpdate();
    }, [update]);

    useEffect(() => {
        if (!messages) {
            return;
        }
        document.title = `${messages.length ? `(${messages.length}) ` : ''}Msg`;
    }, [messages]);

    const fetchMessages = async () => {
        const massage = await (await fetch('/api/message/unreads')).json();
        if (massage.messages.length > 0) {
            setMessages(massage.messages);
        }
    };

    const fetchRequests = async () => {
        const request = await (await fetch('/api/account/requests')).json();
        if (request.requests.length > 0) {
            setRequests(request.requests);
        }
    };

    const handelUpdate = () => {
        if (update.type === 'msg') {
            if (update.add) {
                if (!messages.includes(update.id)) {
                    setMessages([...messages, update.id]);
                }
            } else {
                if (messages.includes(update.id)) {
                    setMessages(messages.filter(m => m !== update.id));
                }
            }
        } else {
            if (update.add) {
                if (!requests.includes(update.id)) {
                    setRequests([...requests, update.id]);
                }
            } else {
                if (requests.includes(update.id)) {
                    setRequests(requests.filter(r => r !== update.id));
                }
            }
        }
    };

    return (
        <header>
            <figure>
                <img src={icon}></img>
            </figure>
            <nav>
                {userLogdin && (
                    <ul>
                        <Searchbar />
                        <li className="icons icon-message">
                            <NavLink
                                to="/message"
                                className="icon"
                                style={{ backgroundImage: `url(${iconMessage})` }}
                            ></NavLink>
                            {messages.length > 0 && <p className="icontop">{messages.length}</p>}
                        </li>
                        <li className="icons icon-account">
                            <NavLink
                                to="/account"
                                className="icon"
                                style={{ backgroundImage: `url(${iconAccount})` }}
                            ></NavLink>
                            {requests.length > 0 && <p className="icontop">{requests.length}</p>}
                        </li>
                        <li className="icons icon-settings">
                            <NavLink
                                to="/settings"
                                className="icon"
                                style={{ backgroundImage: `url(${iconSettings})` }}
                            ></NavLink>
                        </li>
                    </ul>
                )}
            </nav>
        </header>
    );
}
