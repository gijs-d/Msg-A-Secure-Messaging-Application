import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { socket } from '../../lib/socket';

export default function Account() {
    const [username, setUsername] = useState('');
    const [userid, setUserid] = useState('');
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [updateRequests, setUpdateRequests] = useState({ _id: '', username: '', add: false });
    const [updateFriend, setUpdateFriend] = useState({ _id: '', username: '', add: false });

    useEffect(() => {
        fetchInfo();
        const newReq = req =>
            setUpdateRequests({
                _id: req.from,
                username: req.fromUsername,
                add: true,
            });
        const delReq = req =>
            setUpdateRequests({
                _id: req.from,
                to: req.to,
                username: '',
                add: false,
            });
        const newFriend = req =>
            setUpdateFriend({
                _id: req.from,
                to: req.to,
                username: req.fromUsername,
                add: true,
            });
        const delFriend = req =>
            setUpdateFriend({
                _id: req.from,
                to: req.to,
                username: '',
                add: false,
            });
        socket.on('newRequest', newReq);
        socket.on('deleteRequest', delReq);
        socket.on('deleteRequest', delFriend);
        socket.on('confirmRequest', newFriend);
        return () => {
            socket.off('newRequest', newReq);
            socket.off('deleteRequest', delReq);
            socket.on('deleteRequest', delFriend);
            socket.on('confirmRequest', newFriend);
        };
    }, []);

    useEffect(() => {
        if (!updateRequests._id) {
            return;
        }
        let { _id } = updateRequests;
        const { username: updateUsername } = updateRequests;
        if (updateRequests._id == userid && updateRequests.to) {
            _id = updateRequests.to;
        }
        if (requests.some(r => r._id == _id)) {
            if (!updateRequests.add) {
                setRequests(requests.filter(r => r._id !== _id));
            }
        } else {
            if (updateRequests.add) {
                setRequests([...requests, { _id, username: updateUsername }]);
            }
        }
    }, [updateRequests]);
    useEffect(() => {
        if (!updateFriend._id) {
            return;
        }
        let { _id } = updateFriend;
        const { username: updateUsername } = updateRequests;

        if (updateFriend._id == userid && updateFriend.to) {
            _id = updateFriend.to;
        }
        if (friends.some(r => r._id == _id)) {
            if (!updateFriend.add) {
                setFriends(friends.filter(r => r._id !== _id));
            }
        } else {
            if (updateFriend.add) {
                setFriends([...friends, { _id, username: updateUsername }]);
            }
        }
    }, [updateFriend]);

    const fetchInfo = async () => {
        const userProfile = await (await fetch('/api/account')).json();
        if (!userProfile) {
            return;
        }
        setUsername(userProfile.username);
        setUserid(userProfile._id);
        console.log(userProfile);
        setFriends(userProfile.friends);
        setRequests(userProfile.requests);
    };

    return (
        <>
            <h2>{username}</h2>
            <p>{userid}</p>
            <h3>{friends.length} Friends</h3>
            <ul>
                {friends.length > 0 ? (
                    friends.map(friend => (
                        <li key={'friend-' + friend._id}>
                            <NavLink to={`/account/profile/${friend._id}`}>
                                {friend.username}
                            </NavLink>
                        </li>
                    ))
                ) : (
                    <p>Search and add friends to chat with.</p>
                )}
            </ul>
            <h3>{requests.length} Friend requests</h3>
            <ul>
                {requests.length > 0 ? (
                    requests.map(request => (
                        <li key={'request-' + request._id}>
                            <NavLink to={`/account/profile/${request._id}`}>
                                {request.username}
                            </NavLink>
                        </li>
                    ))
                ) : (
                    <p>No friend requests.</p>
                )}
            </ul>
        </>
    );
}
