import React, { useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AddDeviceForm() {
    const [deviceName, setDeviceName] = useState('');
    const [rtspUrl, setRtspUrl] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        const deviceData = {
            name: deviceName,
            rtspUrl: rtspUrl
        };

        try {
            const response = await axios.post('https://vms-demo.onrender.com/device', deviceData);
            console.log(response.data);
            toast.success('Device added successfully!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
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
