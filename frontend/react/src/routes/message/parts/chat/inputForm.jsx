import React, { useEffect, useState } from 'react';
import e2e from '../../../../lib/e2e';
import { socket } from '../../../../socket';

import camIcon from '../../../../assets/media/icon-camera.png';
import arrowSend from '../../../../assets/media/arrow-send.png';

export default function InputForm({
    message,
    setMessage,
    selectedFriend,
    replyMessage,
    inputRef,
    formRef,
    fileInput,
    setFileInput,
}) {
    useEffect(() => {
        setMessage('');
    }, [selectedFriend]);

    useEffect(() => {
        if (!replyMessage) {
            return;
        }
        if (inputRef) {
            inputRef.current.focus();
        }
    }, [replyMessage]);

    const messageChange = e => {
        if (!selectedFriend.id) {
            setMessage('Select friend to chat with first');
            return;
        }

        setMessage(e.target.value);
    };

    const sendOnEnter = e => {
        if (e.keyCode == 13 && e.shiftKey == false) {
            e.preventDefault();
            formRef.current.requestSubmit();
        }
    };

    const inputFile = async e => {
        if (!selectedFriend.id) {
            setMessage('Select friend to chat with first');
            return;
        }
        const urlObj = window.URL || window.webkitURL;
        const src = urlObj.createObjectURL(e.target.files[0]);
        let binary = await fileToBinary(e.target.files[0]);
        const filetype = e.target.files[0].type;
        const ext = e.target.files[0].name.split('.').pop();
        while (binary.length > 500000) {
            binary = await compressImg(filetype, binary);
        }
        const encryptedfile = e2e.encryptMessage(binary, selectedFriend.dkeys, true);
        setFileInput({ file: encryptedfile.msg, ext, filetype, src });
        return;
    };

    const inputFilePaste = async e => {
        if (e.clipboardData && e.clipboardData.items) {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    // We need to represent the image as a file
                    const blob = items[i].getAsFile();
                    inputFile({ target: { files: [blob] } });
                    e.preventDefault();
                }
            }
        }
    };

    const fileToBinary = async file => {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = e => reject(e);
            fr.readAsBinaryString(file);
        });
    };

    const compressImg = async (type, imgstr) => {
        return new Promise(resolve => {
            const img = new Image();
            img.src = `data:${type};base64,${btoa(imgstr)}`;
            const quality = 0.5;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width / 2;
                canvas.height = img.height / 2;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(
                    blob => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            resolve(reader.result);
                        };
                        reader.readAsBinaryString(blob);
                    },
                    type,
                    quality
                );
            };
        });
    };

    return (
        <div className="inputForm">
            <input
                type="file"
                accept="image/*"
                id="sendImage"
                onChange={inputFile}
                style={{ backgroundImage: `url(${camIcon})` }}
            />
            <textarea
                id="messageInput"
                ref={inputRef}
                style={{ height: '50px' }}
                onPaste={inputFilePaste}
                value={message}
                placeholder="Message..."
                onKeyDown={sendOnEnter}
                onInput={messageChange}
            />
            <input
                type="submit"
                id="sendMessage"
                value=" "
                style={{ backgroundImage: `url(${arrowSend})` }}
            />
        </div>
    );
}
