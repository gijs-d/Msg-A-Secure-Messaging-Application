import React, { useState, useEffect, useRef, memo } from 'react';
import e2e from '../../../../lib/e2e';

import lockOpen from '../../../../assets/media/lock-open.png';
import lockClosed from '../../../../assets/media/lock-closed.png';

export default function ImgMsg({ m, selectedFriend, setScrollToBottom }) {
    const [img, setImg] = useState('');
    const [encrypted, setEncrypted] = useState(false);
    const [message, setMessage] = useState('');
    const [fullscreen, setFullscreen] = useState(0);
    const imgRef = useRef(false);

    useEffect(() => {
        loadImg();
    }, [m, selectedFriend]);

    useEffect(() => {
        if (!imgRef || !img || fullscreen < 1) {
            return;
        }
        const fsElem = document.querySelector('#fullscreenImageHolder');
        const popFullscreen = e => closeFullscreen(e, 'pop');
        const closeFullscreen = (e, type) => {
            fsElem.childNodes[2].removeEventListener('click', closeFullscreen);
            window.removeEventListener('popstate', popFullscreen);
            fsElem.style.display = 'none';
            fsElem.childNodes[0].href = '';
            fsElem.childNodes[1].src = '';
            setFullscreen(1);
            if (type != 'pop') {
                history.back();
            }
        };
        if (fullscreen == 2) {
            fsElem.childNodes[0].href = img;
            fsElem.childNodes[1].src = img;
            fsElem.style.display = 'flex';
            window.history.pushState(null, null, window.location.pathname);
            fsElem.childNodes[2].addEventListener('click', closeFullscreen);
            window.addEventListener('popstate', popFullscreen);
            //window.onpopstate = closeFullscreen;
        }
    }, [fullscreen]);

    const loadImg = async () => {
        let encryptedfile = await (await fetch(`/api/${m.src}`)).blob();
        encryptedfile = await fileToBinary(encryptedfile);
        const decryptedfile = e2e.decryptMessage(encryptedfile, selectedFriend.dkeys, true);
        const decryptedMsg = e2e.decryptMessage(m.msg, selectedFriend.dkeys);
        setImg(`data:${m.fileType};base64,${btoa(decryptedfile.msg)}`);
        setMessage(decryptedMsg.msg);
        setEncrypted(decryptedfile.encrypted && decryptedMsg.encrypted);
        setScrollToBottom(true);
    };

    const fileToBinary = async file => {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = e => reject(e);
            fr.readAsBinaryString(file);
        });
    };
    const send = m.to == selectedFriend.id;
    return (
        <>
            {send ? (
                <>
                    <div className="imgMsgdiv">
                        <figure className="lock">
                            <img src={encrypted ? lockClosed : lockOpen} />
                        </figure>
                        <div>
                            <figure
                                className="imgMsg"
                                onClick={() => setFullscreen(2)}
                                ref={imgRef}
                            >
                                <img src={img} />
                            </figure>
                            {message != ' ' && <p className="imgMsgT">{message}</p>}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="imgMsgdiv">
                        <div>
                            <figure
                                className="imgMsg"
                                onClick={() => setFullscreen(2)}
                                ref={imgRef}
                            >
                                <img src={img} />
                            </figure>
                            {message != ' ' && <p className="imgMsgT">{message}</p>}
                        </div>
                        <figure className="lock">
                            <img src={encrypted ? lockClosed : lockOpen} />
                        </figure>
                    </div>
                </>
            )}
        </>
    );
}
