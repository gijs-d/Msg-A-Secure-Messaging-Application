import React, { useState, useEffect, useRef } from 'react';
import e2e from '../../../lib/e2e';
import qrcode from 'qrcode';

export default function Keys({ userId }) {
    const [keys, setKeys] = useState({
        priv1: '',
        priv2: '',
        pub1: '',
        pub2: '',
    });
    const [checkKeys, setCheckKeys] = useState(false);
    const canvas = useRef(null);

    useEffect(() => {
        if (!userId) {
            return;
        }
        loadKeys();
    }, [userId]);

    const genQR = () => {
        if (!canvas) {
            return;
        }
        canvas.current.style.display = 'block';
        qrcode.toCanvas(canvas.current, `Private1: ${keys.priv1} \nPrivate2: ${keys.priv2}`);
    };

    const loadKeys = async () => {
        const usedKeys = await (await fetch('/api/account/keys')).json();
        e2e.loadKeys(userId);
        const savedKeys = e2e.getKeys();
        if (savedKeys) {
            if (savedKeys.pub1 == usedKeys.keys[0] && savedKeys.pub2 == usedKeys.keys[1]) {
                setKeys(savedKeys);
            } else {
                setCheckKeys(true);
                setKeys({
                    pub1: usedKeys.keys[0],
                    pub2: usedKeys.keys[1],
                    priv1: '',
                    priv2: '',
                });
            }
        } else {
            setCheckKeys(true);
            if (usedKeys.keys.length == 2) {
                setKeys({
                    pub1: usedKeys.keys[0],
                    pub2: usedKeys.keys[1],
                    priv1: '',
                    priv2: '',
                });
            }
        }
    };

    const enterKeys = () => {
        e2e.setKeys(keys, userId);
        setCheckKeys(false);
    };

    const genKeys = async () => {
        const oldKeys = e2e.getKeys();
        e2e.genKeys();
        e2e.saveKeys(userId);
        const savedKeys = e2e.getKeys();
        if (savedKeys) {
            setKeys(savedKeys);
            const sendKeys = [savedKeys.pub1, savedKeys.pub2];
            const response = await (
                await fetch('/api/account/keys', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                        keys: sendKeys,
                    }),
                })
            ).json();
            if (!response.update) {
                setKeys(oldKeys);
            }
        }
        setCheckKeys(false);
    };

    const changePriv1 = e => {
        setKeys({ ...keys, priv1: e.target.value });
        setCheckKeys(true);
    };

    const changePriv2 = e => {
        setKeys({ ...keys, priv2: e.target.value });
        setCheckKeys(true);
    };

    return (
        <details open={checkKeys}>
            <summary>Keys</summary>
            <form>
                <label htmlFor="publicKey1">Public key 1</label>
                <textarea id="publicKey1" rows="4" required value={keys.pub1} readOnly></textarea>
                <label htmlFor="publicKey2">Public key 2</label>
                <textarea id="publicKey2" rows="4" required value={keys.pub2} readOnly></textarea>
                {keys.pub1 ? (
                    <>
                        <label htmlFor="privateKey1">Private key 1</label>
                        <textarea
                            id="privateKey1"
                            rows="4"
                            required
                            value={keys.priv1}
                            onChange={changePriv1}
                            placeholder="Enter private or create new keys"
                        ></textarea>
                        <label htmlFor="privateKey2">Private key 2</label>
                        <textarea
                            id="privateKey2"
                            rows="4"
                            required
                            value={keys.priv2}
                            onChange={changePriv2}
                            placeholder="Enter private or create new keys"
                        ></textarea>
                        {checkKeys ? (
                            <input type="submit" value="Enter Keys" onClick={enterKeys}></input>
                        ) : (
                            <input type="button" value="Create QR code" onClick={genQR} />
                        )}
                    </>
                ) : (
                    <>
                        <label htmlFor="privateKey1">Private key 1</label>
                        <textarea
                            id="privateKey1"
                            rows="4"
                            required
                            value={keys.priv1}
                            onChange={changePriv1}
                            placeholder="Create new keys"
                            readOnly
                        ></textarea>
                        <label htmlFor="privateKey2">Private key 2</label>
                        <textarea
                            id="privateKey2"
                            rows="4"
                            required
                            value={keys.priv2}
                            onChange={changePriv2}
                            placeholder="Create new keys"
                            readOnly
                        ></textarea>
                    </>
                )}
                <input type="button" value="Create New Keys" onClick={genKeys} />
                <canvas ref={canvas} style={{ display: 'none' }} id="canvas"></canvas>
            </form>
        </details>
    );
}
