import React, { useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import VideoAnalytics from './VideoAnalytics';
import Sidebar from './Sidebar';

function AddExternalVid() {
    const [streamName, setStreamName] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [analyticsEnabled, setAnalyticsEnabled] = useState("No");
    const [channel, setChannel] = useState(null);
    const vmIp = process.env.REACT_APP_VM_IP

    const handleSubmit = async (event) => {
        event.preventDefault();
        const streamData = {
            name: streamName,
            youtubeUrl: youtubeUrl
        };

        try {
            const response = await axios.post(`${vmIp}:3001/youtube-to-rtsp`, streamData);
            console.log(response.data);
            toast.success('Stream added successfully!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setChannel(response.data.channel)

            if (analyticsEnabled === "Yes" && response.data.response) {
                await triggerAnalytics(response.data.channel);
            }

        } catch (error) {
            console.error('Error adding stream:', error);
            toast.error('Error adding stream.', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
        setStreamName('');
        setYoutubeUrl('');
    };
    const triggerAnalytics = async (channel) => {
        try {
            const response = await axios.post(`${vmIp}:3001/rtsp-analytics`, {
                channel: channel
            });
            console.log("Analytics triggered:", response.data);
        } catch (error) {
            console.error("Error triggering analytics:", error.response || error.message || error);
        }
    };

    return (
        <div>
            <Sidebar />
            <form onSubmit={handleSubmit} className="form">
                <h1>ADD STREAM</h1>
                <div className="add-form-group">
                    <label htmlFor="streamName">Stream Name</label>
                    <input
                        type="text"
                        id="streamName"
                        value={streamName}
                        onChange={(e) => setStreamName(e.target.value)}
                    />
                </div>
                <div className="add-form-group">
                    <label htmlFor="youtubeUrl">Youtube URL</label>
                    <input
                        type="text"
                        id="youtubeUrl"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                    />
                    <VideoAnalytics onAnalyticsChange={setAnalyticsEnabled} />
                </div>

                <div className="add-button-container">
                    <Button
                        type='submit'
                        variant="contained"
                        className="add-custom-button"
                    >
                        Add Stream
                    </Button>
                </div>

            </form>
        </div>
    );
}

export default AddExternalVid;
