import React, { useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './Sidebar';

function AddRecordingForm() {
    const [recordingName, setRecordingName] = useState('');
    const [videoFile, setVideoFile] = useState(null);

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
            });
            console.log(response.data);
            toast.success('Recording added successfully!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } catch (error) {
            console.error('Error adding recording:', error);
            toast.error('Error adding recording.', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };

    return (
        <div>
            <Sidebar />
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
                </div>
                <div className="add-button-container">
                    <Button
                        type='submit'
                        variant="contained"
                        className="add-custom-button"
                    >
                        Add Recording
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default AddRecordingForm;
