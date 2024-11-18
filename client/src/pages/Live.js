import React, { useEffect, useState, useRef } from 'react';
import Hls from 'hls.js';
import Sidebar from '../components/Sidebar';
import '../App.css';
import VideoStatus from '../components/VideoStatus';
import axios from 'axios';
import Recording from '../components/Recording';
import Stream from '../components/Stream';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { FaTrash } from 'react-icons/fa';

const LiveVideo = () => {
    const [liveChannels, setLiveChannels] = useState([]);
    const [channelNames, setChannelNames] = useState({});
    const videoRefs = useRef({});
    const [devices, setDevices] = useState([]);
    const [isError, setIsError] = useState({});
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [selectedChannels, setSelectedChannels] = useState([])

    const vmIp = process.env.REACT_APP_VM_IP_PUBLIC;

    const handleError = (channelId) => {
        setIsError(prevState => ({ ...prevState, [channelId]: true }));
    };

    useEffect(() => {
        const fetchLiveChannels = async () => {
            try {
                const response = await axios.get(`${vmIp}:3001/channel`);
                setLiveChannels(response.data.channels);

                const nameResponse = await axios.get(`${vmIp}: 3001/name`);
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
                hls.loadSource(`${vmIp}:8083/stream/demoStream/channel/${channel}/hls/live/index.m3u8`);
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

    const handleDelete = async (channel) => {
        try {
            await axios.delete(`${vmIp}:3001/device/${channel}`);
            setDevices(devices.filter(device => device.channel !== channel));
            toast.success('Device deleted successfully');
        } catch (error) {
            console.error('Error deleting device:', error);
            toast.error('Failed to delete the device');
        }
    };


    const confirmDelete = (channel) => {
        setSelectedChannel(channel);
        setConfirmVisible(true);
    };

    const acceptDelete = () => {
        handleDelete(selectedChannel);
        setConfirmVisible(false);
    };

    const handleSelectedChannels = (channel) => {
        let channelArray = []
        channelArray = selectedChannel(channel)
    }

    return (
        <>
            <Sidebar />
            <div className='live'>
                <div className="live-content">
                    {liveChannels.map(({ channel }) => (
                        <div key={channel} className="video-section">
                            <div className="video-container">
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
                                <FaTrash size={24} onClick={() => confirmDelete(channel)} className="delete-icon" />
                                <input
                                    type='checkbox'

                                />
                            </div>
                        </div>
                    ))}
                </div>
                <ConfirmDialog
                    className="custom-confirm-dialog"
                    visible={confirmVisible}
                    onHide={() => setConfirmVisible(false)}
                    message="Are you sure you want to delete this device?"
                    header="Confirmation"
                    icon="pi pi-exclamation-triangle"
                    accept={acceptDelete}
                    reject={() => toast.info('Deletion cancelled')}
                />
            </div>
            <ToastContainer />
        </>
    );
}

export default LiveVideo;