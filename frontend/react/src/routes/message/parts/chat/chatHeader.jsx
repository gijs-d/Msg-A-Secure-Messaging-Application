import React from 'react';
import { NavLink } from 'react-router-dom';

import arrowRight from '../../../../assets/media/arrow-right.png';
import arrowBack from '../../../../assets/media/arrow-back.png';
import iconCall from '../../../../assets/media/icon-call.png';
import iconVideo from '../../../../assets/media/icon-video.png';

import { contexts } from '../../../../providers';
const { useCallContext } = contexts;

export default function ChatHeader({ selectedFriend, displaySettings, setDisplaySettings }) {
    const { calling, setCalling } = useCallContext();

    const showBoth = () => {
        setDisplaySettings({ ...displaySettings, showBoth: true });
    };
    const showFriendBar = () => {
        setDisplaySettings({ ...displaySettings, friendBar: true });
    };
    const callFriend = () => {
        if (!selectedFriend.id) {
            return;
        }
        setCalling({
            caller: true,
            active: false,
            status: 'calling',
            type: 'voice',
            username: selectedFriend.username,
            id: selectedFriend.id,
            start: new Date().getTime(),
        });
    };
    const vcallFriend = () => {
        if (!selectedFriend.id) {
            return;
        }
        console.log(selectedFriend);
        setCalling({
            caller: true,
            active: false,
            status: 'calling',
            type: 'video',
            username: selectedFriend.username,
            id: selectedFriend.id,
            start: new Date().getTime(),
        });
    };

    return (
        <div className="chatHeader">
            <div className="chatHeaderStart">
                <input
                    type="button"
                    id="openBar"
                    value=" "
                    style={{ backgroundImage: `url(${arrowRight})` }}
                    className={'displayNav' + (displaySettings.showBoth ? ' closed' : '')}
                    onClick={showBoth}
                />

                <input
                    type="button"
                    id="gotoBar"
                    value=" "
                    style={{ backgroundImage: `url(${arrowBack})` }}
                    className={'displayNav' + (displaySettings.showBoth ? ' closed' : '')}
                    onClick={showFriendBar}
                />
                <h2>
                    {selectedFriend.id ? (
                        <NavLink to={`/account/profile/${selectedFriend.id}`}>
                            {selectedFriend.username}
                        </NavLink>
                    ) : (
                        <a href="#"> {selectedFriend.username}</a>
                    )}
                </h2>
            </div>

            <div className="callBtns">
                <input
                    type="button"
                    value=" "
                    id="call"
                    onClick={callFriend}
                    className="callBtn"
                    style={{ backgroundImage: `url(${iconCall})` }}
                />
                <input
                    type="button"
                    value=" "
                    id="vcall"
                    onClick={vcallFriend}
                    className="callBtn"
                    style={{ backgroundImage: `url(${iconVideo})` }}
                />
            </div>
        </div>
    );
}
