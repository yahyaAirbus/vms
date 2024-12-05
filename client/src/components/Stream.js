import React from 'react';
import axios from 'axios';
import { PiShareFatFill } from "react-icons/pi";
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Dropdown from 'react-bootstrap/Dropdown';

const Stream = ({ channel, selectedChannels }) => {
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

    const handleMultipleStreams = async () => {
        try {
            const response = await axios.post(`${vmIp}:3001/multiple-streams`, { channels: selectedChannels });
            console.log(`Streaming channels ${selectedChannels}:`, response.data.message);
            toast.success('Successfully streaming the selected videos!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } catch (error) {
            console.error('Error switching streams:', error);
            toast.error('Failed to stream selected videos!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    }
    return (
        <div className="button-container">
            <Dropdown as={ButtonGroup}>
                <Button variant="success" className="share" onClick={handleStream}><PiShareFatFill className="share-icon" /> Stream </Button>
                <Dropdown.Toggle split variant="success" id="dropdown-split-basic" className="share" />
                <Dropdown.Menu>
                    <Dropdown.Item onClick={handleMultipleStreams} className="share">Stream multiple lives</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
};

export default Stream;
