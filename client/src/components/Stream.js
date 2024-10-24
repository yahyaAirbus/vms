import React from 'react';
import axios from 'axios';
import { PiShareFatFill } from "react-icons/pi";
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
const Stream = ({ channel }) => {
    const vmIp = process.env.REACT_APP_VM_IP_PUBLIC
    const handleStream = async () => {
        try {
            const response = await axios.post(`${vmIp}:3001/switch_stream`, { channel });
            console.log(`Switched to channel ${channel}:`, response.data.message);
            toast.success('successfuly streaming the video!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } catch (error) {
            console.error('Error switching stream:', error);
            toast.error('Video cannot be streamed!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined
            });
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
