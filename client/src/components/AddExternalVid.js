import React, { useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './Sidebar';

function AddExternalVid() {
    const [streamName, setStreamName] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        const streamData = {
            name: streamName,
            youtubeUrl: youtubeUrl
        };

        try {
            const response = await axios.post('https://18.191.200.18:3001/youtube-to-rtsp', streamData);
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
