import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';
import Checkbox from '@mui/material/Checkbox';
import '../App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import Share from '../components/Share';

function Archive() {
    const [recordings, setRecordings] = useState([]);
    const [selectedRecordings, setSelectedRecordings] = useState([]);
    const videoRefs = useRef({});
    const vmIp = process.env.REACT_APP_VM_IP_PUBLIC;

    const label = { inputProps: { 'aria-label': 'Checkbox' } };

    useEffect(() => {
        const fetchRecordings = async () => {
            try {
                const response = await axios.get(`http://${vmIp}:3001/recordings`);
                setRecordings(response.data);
            } catch (error) {
                console.error('Error fetching recordings:', error);
            }
        };

        fetchRecordings();
    }, [vmIp]);

    const handleDelete = async (recordingKey) => {
        try {
            await axios.delete(`http://${vmIp}:3001/recordings/${recordingKey}`);
            setRecordings((prevRecordings) =>
                prevRecordings.filter((recording) => recording.key !== recordingKey)
            );
            toast.success('Recording deleted successfully');
        } catch (error) {
            console.error('Error deleting recording:', error);
            toast.error('Failed to delete the recording');
        }
    };

    const confirmDelete = (recordingKey) => {
        confirmDialog({
            message: 'Are you sure you want to delete this recording?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => handleDelete(recordingKey),
            reject: () => toast.info('Deletion cancelled'),
            className: 'custom-confirm-dialog',
        });
    };

    const toggleSelectedRecording = (recordingKey) => {
        if (!recordingKey) {
            console.error('Invalid recording key:', recordingKey);
            return;
        }
        setSelectedRecordings((prevSelected) =>
            prevSelected.includes(recordingKey)
                ? prevSelected.filter((key) => key !== recordingKey)
                : [...prevSelected, recordingKey]
        );
    };

    return (
        <div>
            <Sidebar />

            <div className="live">
                <div className="live-content">
                    <h1>Recordings</h1>
                    {recordings.length > 0 ? (
                        recordings.map((recording, index) => (
                            <div key={recording.key} className="video-section">
                                <div className="video-container">
                                    <video
                                        ref={(el) => (videoRefs.current[recording.key] = el)}
                                        controls
                                        autoPlay={false}
                                        muted
                                        width="100%"
                                    >
                                        <source src={recording.url} type="video/mp4" />
                                    </video>
                                </div>
                                <div className="video-info">
                                    <h3>Recording {index + 1}</h3>
                                    <FaTrash
                                        size={24}
                                        onClick={() => confirmDelete(recording.key)}
                                        className="delete-icon"
                                    />
                                    <div className="check-box">
                                        <Checkbox
                                            {...label}
                                            checked={selectedRecordings.includes(recording.key)}
                                            onChange={() => toggleSelectedRecording(recording.key)}
                                        />
                                    </div>
                                    <Share
                                        recording_key={selectedRecordings}
                                    />


                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No recordings found.</p>
                    )}
                </div>
            </div>

            <ToastContainer />
            <ConfirmDialog />
        </div>
    );
}

export default Archive;
