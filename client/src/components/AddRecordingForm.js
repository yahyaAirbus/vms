import React, { useRef, useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './Sidebar';
import VideoAnalytics from '../components/VideoAnalytics';

function AddRecordingForm() {
    const [recordingName, setRecordingName] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [analyticsEnabled, setAnalyticsEnabled] = useState("No");

    const toastId = useRef(null);

    const handleFileChange = (event) => {
        setVideoFile(event.target.files[0]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('name', recordingName);
        formData.append('video', videoFile);

        try {
            const response = await axios.post('http://127.0.0.1:3001/add-recording', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: progressEvent => {
                    const progress = Math.round(progressEvent.loaded / progressEvent.total);

                    if (toastId.current === null) {
                        toastId.current = toast.info(`Please wait, Upload in Progress`, {
                            progress: progress / 100,  // Progress should be between 0 and 1
                            autoClose: false,
                            isLoading: true,
                        });
                    } else {
                        toast.update(toastId.current, {
                            render: `Please wait, Upload in Progress`,
                            progress: progress / 100,  // Update progress bar
                        });
                    }
                },
            });

            // Once the upload is complete, update the toast and mark it as done
            toast.update(toastId.current, {
                render: "Upload Complete!",
                type: "success",
                isLoading: false,
                autoClose: 5000,
            });

            const recordingKey = response.data.recordingKey;

            // Trigger analytics if enabled
            if (analyticsEnabled === "Yes" && recordingKey) {
                await triggerAnalytics(recordingKey);
            }
        } catch (error) {
            console.error('Error adding recording:', error);

            toast.update(toastId.current, {
                render: "Upload Failed",
                type: "error",
                isLoading: false,
                autoClose: 5000,
            });
        }
    };

    const triggerAnalytics = async (recordingKey) => {
        try {
            const response = await axios.post('http://127.0.0.1:3001/recording-analytics', {
                recordingKey: recordingKey
            });
            console.log("Analytics triggered:", response.data);
        } catch (error) {
            console.error("Error triggering analytics:", error.response || error.message || error);
        }
    };

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <div style={{ flexGrow: 1 }}>
                <form onSubmit={handleSubmit} className="form">
                    <h1>ADD Recording</h1>
                    <div className="add-form-group">
                        <label htmlFor="recordingName">Recording name</label>
                        <input
                            type="text"
                            id="recordingName"
                            value={recordingName}
                            onChange={(e) => setRecordingName(e.target.value)}
                        />
                    </div>
                    <div className="add-form-group">
                        <label htmlFor="videoFile">Upload Video</label>
                        <input
                            type="file"
                            id="videoFile"
                            accept="video/*"
                            onChange={handleFileChange}
                        />
                        <VideoAnalytics onAnalyticsChange={setAnalyticsEnabled} />
                    </div>
                    <div className="add-button-container">
                        <Button
                            type='submit'
                            variant="contained"
                            className="add-custom-button"
                        >
                            Add Recording
                        </Button>
                        <ToastContainer limit={1} />
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddRecordingForm;
