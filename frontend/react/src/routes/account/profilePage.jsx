import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { socket } from '../../lib/socket';

import { contexts } from '../../providers';
const { useUserLogdinContext } = contexts;

export default function ProfilePage() {
    const [username, setUsername] = useState('');
    const [userid, setUserid] = useState('');
    const [status, setStatus] = useState('');
    const [statusNr, setStatusNr] = useState(-1);
    const { profileId } = useParams();
    const { userLogdin, setUserLogdin } = useUserLogdinContext();

    useEffect(() => {
        fetchInfo();
        const request = async msg => {
            if (msg.to == profileId) {
                setStatus(msg.status.userStatusEnum);
            } else if (status == 'Delete friend') {
                setStatus(msg.status.userStatusEnum);
            }
            setStatus(msg.status.userStatusEnum);
            // setStatus(msg.status.userStatusEnum);

            //setStatusNr(msg.status.statusNr)
        };

        socket.on('newRequest', request);
        socket.on('confirmRequest', request);
        socket.on('deleteRequest', request);
        return () => {
            socket.off('newRequest', request);
            socket.off('confirmRequest', request);
            socket.off('deleteRequest', request);
        };
    }, [profileId]);

    const fetchInfo = async () => {
        const data = await (
            await fetch('/api/account/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId }),
            })
        ).json();
        if (!data.profile) {
            return;
        }
        setUserid(data.profile._id);
        setUsername(data.profile.username);
        if (!data.status) {
            return;
        }
        setStatus(data.status);
        setStatusNr(data.statusNr);
    };

    const onClick = async () => {
        const nStatus = await (
            await fetch('/api/account/friend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    profileId,
                }),
            })
        ).json();

        if (!nStatus.changed) {
            return;
        }
        setStatus(nStatus.changed);
    };

    return (
        <>
            {profileId == userLogdin && <Navigate to="/account" />}
            <h2>{username}</h2>
            <p>{userid}</p>
            {status && <input type="button" value={status} onClick={onClick} />}
        </>
    );
}
