import React from 'react';
import axios from 'axios';
import { PiShareFatFill } from "react-icons/pi";
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';

const Share = ({ recording_key }) => {
    const vmIp = process.env.REACT_APP_VM_IP_PUBLIC
    const handleShare = async () => {
        try {
            const videourl = await axios.post(`${vmIp}:3001/share-recording/${recording_key}`)

            console.log(videourl)
            toast.success('Recording shared successfully!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } catch (error) {
            console.error('Error sharing recording:', error);
            toast.error('Error sharing recording.', {
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
        <div className="button-container">
            <button className="share" onClick={handleShare}>
                <PiShareFatFill className="share-icon" />
                Share
            </button>
        </div>
    );
};

export default Share;
