import React, { useState } from 'react';
import axios from 'axios';
import { FaRecordVinyl, FaStop } from 'react-icons/fa';

const Recording = ({ channel }) => {
    const [isRecording, setIsRecording] = useState(false);

    const startRecording = async (channelId) => {
        setIsRecording(true);
        try {
            await axios.post('https://18.191.200.18:3001/record/start', { channel: channelId });
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    };


    const stopRecording = async () => {
        setIsRecording(false);
        try {
            await axios.post('https://18.191.200.18:3001/record/stop');
        } catch (error) {
            console.error('Error stopping recording:', error);
        }
    };

    return (
        <div>
            {isRecording ? (
                <button className="record-button stop" onClick={stopRecording}>
                    <FaStop className="icon" /> Stop Recording
                </button>
            ) : (
                <button className="record-button start" onClick={() => startRecording(channel)}>
                    <FaRecordVinyl className="icon" /> Start Recording
                </button>
            )}
        </div>
    );
};

export default Recording;
