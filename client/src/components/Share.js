import React from 'react';
import axios from 'axios';
import { PiShareFatFill } from "react-icons/pi";
import { toast } from 'react-toastify';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Dropdown from 'react-bootstrap/Dropdown';

const Share = ({ recording_key }) => {
    const vmIp = process.env.REACT_APP_VM_IP_PUBLIC;

    const handleShare = async () => {
        try {
            await axios.post(`http://${vmIp}:3001/share-recording/${recording_key}`);
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

    const handleShareMultipleRecordings = async () => {
        try {
            const videoUrlArray = await axios.post(`http://${vmIp}:3001/multiple-recordings`, {
                recording_key,
            });

            toast.success('The selected recordings were shared successfully!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } catch (error) {
            console.error('Error sharing multiple recordings:', error);
            toast.error('Error sharing recordings.', {
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
            <Dropdown as={ButtonGroup}>
                <Button variant="success" className="share" onClick={handleShare}>
                    <PiShareFatFill className="share-icon" />
                    Share
                </Button>
                <Dropdown.Toggle split variant="success" id="dropdown-split-basic" className="share" />
                <Dropdown.Menu>
                    <Dropdown.Item onClick={handleShareMultipleRecordings} className="share">
                        Share multiple streams
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
};

export default Share;
