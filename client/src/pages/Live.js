import React, { useEffect, useState, useRef } from 'react';
import Hls from 'hls.js';
import Sidebar from '../components/Sidebar';
import '../App.css';
import VideoStatus from '../components/VideoStatus';
import axios from 'axios';
import Recording from '../components/Recording';
import Stream from '../components/Stream';
const LiveVideo = () => {
    const [liveChannels, setLiveChannels] = useState([]);
    const [channelNames, setChannelNames] = useState({});
    const videoRefs = useRef({});
    const [isError, setIsError] = useState({});

    const handleError = (channelId) => {
        setIsError(prevState => ({ ...prevState, [channelId]: true }));
    };

    useEffect(() => {
        const fetchLiveChannels = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:3001/channel');
                setLiveChannels(response.data.channels);

                const nameResponse = await axios.get('http://127.0.0.1:3001/name');
                const names = {};
                nameResponse.data.names.forEach(({ channel, name }) => {
                    names[channel] = name;
                });
                setChannelNames(names);
            } catch (error) {
                console.error('Error fetching live channels:', error);
            }
        };
        fetchLiveChannels();
    }, []);

    useEffect(() => {
        liveChannels.forEach(({ channel }) => {
            if (!Hls.isSupported()) {
                handleError(channel);
                return;
            }
            const initializeHls = () => {
                const hls = new Hls();
                hls.loadSource(`http://127.0.0.1:8083/stream/demoStream/channel/${channel}/hls/live/index.m3u8`);
                hls.attachMedia(videoRefs.current[channel]);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    setIsError(prevState => ({ ...prevState, [channel]: false }));
                });
                hls.on(Hls.Events.ERROR, () => handleError(channel));
                return () => {
                    hls.destroy();
                };
            };
            initializeHls(channel);
        });

        return () => {
            liveChannels.forEach(({ channel }) => {
                const video = videoRefs.current[channel];
                if (video) {
                    video.pause();
                    video.removeAttribute('src');
                }
            });
        };
    }, [liveChannels]);

    return (
        <>
            <Sidebar />
            <div className='live'>
                <div className="live-content">
                    {liveChannels.map(({ channel }) => (
                        <div key={channel} className="video-section">
                            <div className="video-container" >
                                <video
                                    id="liveVideo"
                                    ref={el => videoRefs.current[channel] = el}
                                    controls
                                    muted
                                    onError={() => handleError(channel)}
                                ></video>
                            </div>
                            <div className="video-info">
                                <h3>{channelNames[channel]}</h3>
                                <VideoStatus channelId={channel} />
                                <Recording channel={channel} />
                                <Stream channel={channel} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default LiveVideo;
