import React, { useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import VideoAnalytics from '../components/VideoAnalytics';

function AddDeviceForm() {
    const [deviceName, setDeviceName] = useState('');
    const [rtspUrl, setRtspUrl] = useState('');
    const [channel, setChannel] = useState(null);  // State to store the channel
    const [analyticsEnabled, setAnalyticsEnabled] = useState("No"); // State to track analytics

    const handleSubmit = async (event) => {
        event.preventDefault();
        const deviceData = {
            name: deviceName,
            rtspUrl: rtspUrl
        };

        try {
            const response = await axios.post('http://127.0.0.1:3001/device', deviceData);
            console.log(response.data);

            setChannel(response.data.channel);  // Store the channel number in state

            toast.success('Device added successfully!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });

            // Check if analytics should be triggered after device is added
            if (analyticsEnabled === "Yes" && response.data.channel) {
                await triggerAnalytics(response.data.channel);
            }
        } catch (error) {
            console.error('Error adding device:', error);
            toast.error('Error adding device.', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
        setDeviceName('');
        setRtspUrl('');
    };

    // Function to trigger analytics
    const triggerAnalytics = async (channel) => {
        try {
            const response = await axios.post('http://127.0.0.1:3001/rtsp-analytics', {
                channel: channel
            });
            console.log("Analytics triggered:", response.data);
        } catch (error) {
            console.error("Error triggering analytics:", error.response || error.message || error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form">
            <h1>ADD DEVICE</h1>
            <div className="add-form-group">
                <label htmlFor="deviceName">Device Name</label>
                <input
                    type="text"
                    id="deviceName"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                />
            </div>
            <div className="add-form-group">
                <label htmlFor="rtspUrl">RTSP Link</label>
                <input
                    type="text"
                    id="rtspUrl"
                    value={rtspUrl}
                    onChange={(e) => setRtspUrl(e.target.value)}
                />
            </div>

            <div className="add-form-group">
                <VideoAnalytics
                    onAnalyticsChange={setAnalyticsEnabled}
                />
            </div>

            <div className="add-button-container">
                <Button
                    type='submit'
                    variant="contained"
                    className="add-custom-button"
                >
                    Add Device
                </Button>
            </div>
        </form>
    );
}

export default AddDeviceForm;
