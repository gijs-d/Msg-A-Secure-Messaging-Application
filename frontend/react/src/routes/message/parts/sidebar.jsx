import React, { useState } from 'react';

import arrowLeft from '../../../assets/media/arrow-left.png';
import arrowDrag from '../../../assets/media/arrow-drag.png';

import FriendBarList from './sidebar/friendBarList';

export default function Sidebar({
    selectedFriend,
    setSelectedFriend,
    newMessage,
    displaySettings,
    setDisplaySettings,
    deletedMessage,
}) {
    const [sidebarWidth, setSidebarWidth] = useState('20%');

    const checkWidth = newWidth => {
        if (newWidth < 65) {
            return 65;
        }
        if (newWidth > window.innerWidth - 170) {
            return window.innerWidth - 170;
        }
        return newWidth;
    };

    const drag = e => {
        if (e.clientX == 0) {
            return;
        }
        setSidebarWidth(`${checkWidth(e.clientX)}px`);
    };

    const drags = e => {
        setSidebarWidth(`${checkWidth(e.clientX)}px`);
    };

    const dragt = e => {
        if (e.targetTouches[0].clientX == 0) {
            return;
        }
        setSidebarWidth(`${checkWidth(e.targetTouches[0].clientX)}px`);
    };

    const dragst = e => {
        setSidebarWidth(`${checkWidth(e.targetTouches[0].clientX)}px`);
    };

    const closeFriendBar = () => {
        if (displaySettings.showBoth && !selectedFriend.id) {
            setDisplaySettings({ showBoth: false, friendBar: true });
            return;
        }
        setDisplaySettings({ showBoth: false, friendBar: false });
    };

    return (
        <aside
            className={
                'friendBar' +
                (!displaySettings.showBoth && !displaySettings.friendBar ? ' closed' : '')
            }
            style={{ width: displaySettings.showBoth ? sidebarWidth : '100%' }}
        >
            <input
                type="button"
                id="closeBar"
                value=" "
                style={{ backgroundImage: `url(${arrowLeft})` }}
                className={'displayNav' + (!displaySettings.showBoth ? ' closed' : '')}
                onClick={closeFriendBar}
            />
            <input
                type="button"
                id="asideSlider"
                value=" "
                style={{ backgroundImage: `url(${arrowDrag})` }}
                className={'displayNav' + (!displaySettings.showBoth ? ' closed' : '')}
                draggable
                onDrag={drag}
                onDragEnd={drags}
                onTouchMove={dragt}
                onTouchEnd={dragst}
            />
            <FriendBarList
                {...{
                    selectedFriend,
                    setSelectedFriend,
                    newMessage,
                    displaySettings,
                    setDisplaySettings,
                    deletedMessage,
                }}
            />
        </aside>
    );
}
