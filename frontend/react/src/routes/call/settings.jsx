import React, { useState, useEffect } from 'react';
import Keys from './parts/keys';
import OnOffSlider from '../../parts/slider';

import { contexts } from '../../providers';
const { useUserLogdinContext, useThemeContext, useNotificationContext } = contexts;

export default function Settings() {
    const { userLogdin, setUserLogdin } = useUserLogdinContext();
    const { notifications, setNotifications } = useNotificationContext();
    const { theme, setTheme } = useThemeContext();

    const [searchable, setSearchable] = useState(false);
    const [userId, setUserId] = useState('');

    useEffect(() => {
        fetchInfo();
    }, []);

    const fetchInfo = async () => {
        const result = await (await fetch('/api/account/searchable')).json();
        if (result.error) {
            return;
        }
        setSearchable(result.searchable);
        setUserId(result._id);
        return;
    };

    const changeSearchable = async e => {
        const value = e.target.checked;
        const res = await (
            await fetch('/api/account/searchable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ searchable: value }),
            })
        ).json();
        if (res.changed) {
            setSearchable(value);
        }
    };

    const changeNotifications = async e => {
        const value = e.target.checked;
        if (typeof AndroidMain !== 'undefined') {
            AndroidMain.setNotifications(value);
        } else if (typeof Notification !== 'undefined') {
            if (value) {
                Notification.requestPermission();
            }
        }

        localStorage.setItem('notifications', value);
        setNotifications(value);
    };

    const changeDnMode = async e => {
        const value = e.target.checked ? 'dark' : 'light';
        localStorage.setItem('theme', value);
        setTheme(value);
    };

    const logout = async () => {
        const logdout = await (await fetch('/api/login/logout')).json();
        if (logdout.logdout) {
            setUserLogdin(false);
        }
    };

    return (
        <>
            <h2>Settings</h2>
            <Keys userId={userId} />
            <details>
                <summary>Account</summary>
                <form>
                    <label htmlFor="searchable">Searchable</label>
                    <OnOffSlider id="searchable" checked={searchable} onChange={changeSearchable} />
                </form>
            </details>
            <details>
                <summary>Notifications</summary>
                <form>
                    <label htmlFor="msgNotifications">Messages</label>
                    <OnOffSlider
                        id="msgNotifications"
                        checked={notifications}
                        onChange={changeNotifications}
                    />
                </form>
            </details>

            <details>
                <summary>Appearance</summary>
                <form>
                    <label htmlFor="dnmode">Day/Night mode</label>
                    <OnOffSlider id="dnmode" checked={theme === 'dark'} onChange={changeDnMode} />
                </form>
            </details>
            <details>
                <summary>Download</summary>
                <a href="/api/uploads/androidApk" download>
                    msgv6.apk
                </a>
            </details>

            <input type="button" id="logout" value="Logout" onClick={logout} />
        </>
    );
}
