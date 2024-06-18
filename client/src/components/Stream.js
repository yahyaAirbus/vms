import React from 'react';
import axios from 'axios';
import { PiShareFatFill } from "react-icons/pi";

const Stream = ({ channel }) => {
    const handleStream = async () => {
        try {
            const response = await axios.post('http://localhost:3001/switch_stream', { channel });
            console.log(`Switched to channel ${channel}:`, response.data.message);
        } catch (error) {
            console.error('Error switching stream:', error);
        }
    };

    return (
        <div className="button-container">
            <button className="share" onClick={handleStream}>
                <PiShareFatFill className="share-icon" />
                Stream
            </button>
        </div>
    );
};

export default Stream;
