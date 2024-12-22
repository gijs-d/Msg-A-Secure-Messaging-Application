import React, { useRef, useState, useEffect } from 'react';
import { socket } from '../../lib/socket';
import e2e from '../../lib/e2e';
import { Peer } from 'peerjs';

import iconAnser from '../../assets/media/icon-call.png';
import iconEnd from '../../assets/media/icon-call-end.png';
import iconVolume from '../../assets/media/icon-volume.png';
import iconMic from '../../assets/media/icon-mic.png';
import iconVideo from '../../assets/media/icon-video.png';
import iconMenu from '../../assets/media/icon-menu.png';

import { contexts } from '../../providers';
const { useUserLogdinContext, useCallContext } = contexts;

export default function Call() {
    const { userLogdin, setUserLogdin } = useUserLogdinContext();
    const { calling, setCalling } = useCallContext();

    const [myStream, setMyStream] = useState(false);
    const [closeStream, setCloseStream] = useState(false);
    const [peer, setPeer] = useState(false);
    const [muted, setMuted] = useState(false);
    const [muteMic, setMuteMic] = useState(false);
    const [disableVideo, setDisableVideo] = useState(false);
    const [devices, setDevices] = useState([]);
    const [sliderValue, setSliderValue] = useState({ low: 0, mid: 0, high: 0 });
    const [openMenu, setOpenMenu] = useState(false);
    const [heartbeatInterval, setHeartbeatInterval] = useState(false);

    const videoRef = useRef(null);
    const video2Ref = useRef(null);
    const interval = useRef(null);
    const gainNode = useRef({
        low: 0,
        mid: 0,
        high: 0,
    });

    useEffect(() => {
        const enablePeer = msg => loadPeer(msg.peerId);
        socket.on('peerId', enablePeer);
        const pingCall = () => socket.emit('pingCall');
        socket.on('pingCall', pingCall);
        socket.emit('getPeerId');
        return () => {
            socket.off('pingCall', pingCall);
            socket.off('peerId', enablePeer);
        };
    }, []);
    useEffect(() => {}, [devices]);
    useEffect(() => {
        if (!gainNode.current?.high?.gain) {
            return;
        }
        console.log(gainNode);

        //gainNode.current.low.gain.value = sliderValue.low;
        //gainNode.current.mid.gain.value = sliderValue.mid;
        gainNode.current.high.gain.value = sliderValue.high;
    }, [sliderValue]);
    useEffect(() => {
        if (!peer) {
            return;
        }
        if (calling.caller) {
            call();
        }
        socket.on('callEnd', endCall);
        return () => {
            endCall();
            socket.off('callEnd', endCall);
        };
    }, [peer]);

    useEffect(() => {
        if (!closeStream) {
            return;
        }
        if (myStream) {
            myStream.getTracks().forEach(track => track.stop());
            setMyStream(false);
        }
        setCalling({
            status: false,
        });
        socket.emit('callEnd', calling);
        peer.destroy();
    }, [closeStream]);

    useEffect(() => {
        if (!myStream || !calling.active) {
            return;
        }
        myStream.getAudioTracks().forEach(track => {
            track.enabled = !muteMic;
        });
    }, [muteMic]);
    useEffect(() => {
        if (!myStream || !calling.active) {
            return;
        }
        myStream.getVideoTracks().forEach(track => {
            track.enabled = !disableVideo;
        });
    }, [disableVideo]);

    const loadPeer = peerId => {
        setPeer(new Peer(peerId, { host: '/', port: 443, path: '/api/peerjs' }));
    };

    const showVideoStream = (video, stream, addBooster) => {
        if (addBooster) {
            // Create an AudioContext

            const context = new AudioContext();

            // Create a MediaStreamAudioSourceNode from the video element

            const audioSource = context.createMediaElementSource(video);
            const highnode = context.createBiquadFilter();
            highnode.type = 'highshelf';
            highnode.frequency.value = 20;
            highnode.gain.value = sliderValue.high;
            gainNode.current.high = highnode;

            audioSource.connect(highnode);

            //lownode.connect(audioCtx.destination);
            highnode.connect(context.destination);
            //const audioDestination = new MediaStream();

            //lownode.connect(audioDestination);
            /**
             * 
             *        const highnode = context.createBiquadFilter();
            highnode.type = "highshelf";
            highnode.frequency.value = 6000;
            highnode.gain.value = sliderValue.high;
            gainNode.current.high = highnode;

            const midnode = context.createBiquadFilter();
            midnode.type = "peaking";
            midnode.frequency.value = 1000;
            midnode.Q.value = 100;
            midnode.gain.value = sliderValue.high;
            gainNode.current.mid = midnode;

            const lownode = context.createBiquadFilter();
            lownode.type = "lowshelf";
            lownode.frequency.value = 200;
            lownode.gain.value = sliderValue.high;
            gainNode.current.low = lownode;

            audioSource.connect(highnode);
            highnode.connect(midnode);
            midnode.connect(lownode);
            //lownode.connect(audioCtx.destination);
            lownode.connect(context.destination);
             * 
             */

            //audioSource.replaceTrack(audioDestination.addTrack(audioSource));
        }

        video.srcObject = stream;
        video.autoplay = true;
        video.addEventListener('loadedmetadata', () => {
            video.play();
        });
    };

    const getStream = async () => {
        let stream;

        try {
            const deviceList = await navigator.mediaDevices.enumerateDevices();
            setDevices(deviceList);
            const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
            alert(JSON.stringify(deviceList));
            const constraints = {
                audio: true,
                video: calling.type == 'video' && {
                    deviceId: { exact: videoDevices[0].deviceId },
                },
            };
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
            setCalling({
                status: false,
            });
            alert('Cant get stream ' + e);
            console.error('cant get stream', e);
        }

        if (calling.type == 'video') {
            videoRef.current.muted = true;
            showVideoStream(videoRef.current, stream);
        }
        setMyStream(stream);
        return stream;
    };

    const call = async () => {
        const stream = await getStream();
        peer.on('call', peerCall => {
            setCalling({ ...calling, active: true });
            peerCall.answer(stream);

            peerCall.on(
                'stream',
                remoteStream => showVideoStream(video2Ref.current, remoteStream),
                true
            );
        });
        //clearInterval(interval.current);
        //interval.current = setInterval(ping, 3000);
        socket.emit('call', calling);
    };

    const answerCall = async () => {
        if (!peer) {
            loadPeer();
        }
        setCalling({ ...calling, active: true });
        const stream = await getStream();
        peer.on('call', peerCall => {
            setCalling({ ...calling, active: true });
            peerCall.answer(stream);

            peerCall.on('stream', remoteStream =>
                showVideoStream(video2Ref.current, remoteStream, true)
            );
        });

        let callPeer = peer.call(calling.peerid, stream);
        if (!callPeer) {
            callPeer = peer.call(calling.id, stream);
        }
        if (!callPeer) {
            alert('connection lost ');
            endCall();
            clearInterval(interval.current);
            return;
        }
        callPeer.on('stream', remoteStream =>
            showVideoStream(video2Ref.current, remoteStream, true)
        );

        clearInterval(interval.current);

        const ping = () => {
            socket.emit('call', calling);
        };
        //interval.current = setInterval(ping, 3000);
        ping();
    };
    const endCall = async () => {
        setCloseStream(true);
        clearInterval(interval.current);
    };
    const switchVids = () => {
        if (video2Ref.current.classList.contains('smallVid')) {
            video2Ref.current.classList.remove('smallVid');
            videoRef.current.classList.add('smallVid');
        } else {
            video2Ref.current.classList.add('smallVid');
            videoRef.current.classList.remove('smallVid');
        }
    };

    return (
        <>
            <h2>{calling.username}</h2>
            <div id="videoDiv" style={{ maxHeight: calling.active ? 'unset' : '30%' }}>
                <video ref={video2Ref} id="vid2" muted={muted} onClick={switchVids}></video>
                <video ref={videoRef} id="vid1" className="smallVid" onClick={switchVids}></video>
            </div>

            <div className="callingBtns">
                {calling.active && (
                    <div className="callingBtn" id="muteFriend">
                        {muted && <div className="stripe"></div>}
                        <input
                            type="button"
                            value=" "
                            onClick={() => setMuted(!muted)}
                            style={{ backgroundImage: `url(${iconVolume})` }}
                        />
                    </div>
                )}
                {calling.active && calling.type == 'video' && (
                    <div className="callingBtn" id="muteMic">
                        {muteMic && <div className="stripe"></div>}
                        <input
                            type="button"
                            value=" "
                            onClick={() => setMuteMic(!muteMic)}
                            style={{ backgroundImage: `url(${iconMic})` }}
                        />
                    </div>
                )}

                <div className="callingBtn" id="endCall">
                    <input
                        type="button"
                        value=" "
                        onClick={endCall}
                        style={{ backgroundImage: `url(${iconEnd})` }}
                    />
                </div>

                {!calling.active && !calling.caller && (
                    <div className="callingBtn" id="anserCall">
                        <input
                            type="button"
                            value=" "
                            onClick={answerCall}
                            style={{ backgroundImage: `url(${iconAnser})` }}
                        />
                    </div>
                )}

                {calling.active && calling.type != 'video' && (
                    <div className="callingBtn" id="muteMic">
                        {muteMic && <div className="stripe"></div>}
                        <input
                            type="button"
                            value=" "
                            onClick={() => setMuteMic(!muteMic)}
                            style={{ backgroundImage: `url(${iconMic})` }}
                        />
                    </div>
                )}

                {calling.active && calling.type == 'video' && (
                    <div className="callingBtn" id="disableVideo">
                        {disableVideo && <div className="stripe"></div>}
                        <input
                            type="button"
                            value=" "
                            onClick={() => setDisableVideo(!disableVideo)}
                            style={{ backgroundImage: `url(${iconVideo})` }}
                        />
                    </div>
                )}

                {calling.active && calling.type == 'video' && (
                    <div className="callingBtn" id="videoMenu">
                        {openMenu && (
                            <ul id="videoMenuList">
                                <li>
                                    <label htmlFor="volumeSliderh">gain {sliderValue.high}</label>
                                    <input
                                        type="range"
                                        id="volumeSliderh"
                                        min="0"
                                        value={sliderValue.high}
                                        onChange={e =>
                                            setSliderValue({
                                                ...sliderValue,
                                                high: Number(e.target.value),
                                            })
                                        }
                                        max="50"
                                    />
                                </li>
                                <li>
                                    <label htmlFor="devices">device</label>
                                    <select>
                                        {devices
                                            .map((device, i) => (
                                                <option key={i} value={device.deviceId}>
                                                    {device.label || `device ${i + 1}`}
                                                </option>
                                            ))
                                            .join('')}
                                    </select>
                                </li>
                            </ul>
                        )}
                        <input
                            type="button"
                            value=" "
                            onClick={() => setOpenMenu(!openMenu)}
                            style={{ backgroundImage: `url(${iconMenu})` }}
                        />
                    </div>
                )}
            </div>
        </>
    );
}

/**
 *           <label for="volumeSlider">high {sliderValue.high}</label>
                                <input type="range" id="volumeSliderh" min="0" value={sliderValue.high} onChange={(e) => setSliderValue({ ...sliderValue, high: Number(e.target.value) })} max="50" />
                                <label for="volumeSlider">mid {sliderValue.mid}</label>
                                <input type="range" id="volumeSliderm" min="0" value={sliderValue.mid} onChange={(e) => setSliderValue({ ...sliderValue, mid: Number(e.target.value) })} max="50" />
                                <label for="volumeSlider">low {sliderValue.low}</label>
                                <input type="range" id="volumeSliderl" min="0" value={sliderValue.low} onChange={(e) => setSliderValue({ ...sliderValue, low: Number(e.target.value) })} max="50" />
 * 
 * 
 * 
 */
