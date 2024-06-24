import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';
import '../App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import Share from '../components/Share';

function Archive() {
    const [recordings, setRecordings] = useState([]);
    const videoRefs = useRef({});

    useEffect(() => {
        const fetchRecordings = async () => {
            try {
                const response = await axios.get('http://18.191.200.18:3001/recordings');
                console.log('Recordings:', response.data);
                setRecordings(response.data);
            } catch (error) {
                console.error('Error fetching recordings:', error);
            }
        };

        fetchRecordings();
    }, []);

    const handleDelete = async (recordingKey) => {
        try {
            await axios.delete(`http://18.191.200.18:3001/recordings/${recordingKey}`);
            setRecordings(recordings.filter(recording => recording.key !== recordingKey));
            toast.success('Recording deleted successfully');
        } catch (error) {
            console.error('Error deleting recording:', error);
        }
    };

    const confirmDelete = (recordingKey) => {
        confirmDialog({
            message: 'Are you sure you want to delete this recording?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => handleDelete(recordingKey),
            reject: () => toast.info('Deletion cancelled'),
            className: 'custom-confirm-dialog'
        });
    };

    return (
        <div>
            <Sidebar />

            <div className='live'>
                <div className="live-content">
                    <h1>Recordings</h1>
                    {recordings.length > 0 ? (
                        recordings.map((recording, index) => (
                            <div key={recording.key} className="video-section">
                                <div className="video-container">
                                    <video
                                        ref={el => videoRefs.current[recording.key] = el}
                                        controls
                                        autoPlay
                                        muted
                                        width="100%"
                                    >
                                        <source src={recording.url} type='video/mp4' />
                                    </video>
                                </div>
                                <div className="video-info">
                                    <h3>Recording {index + 1}</h3>
                                    <FaTrash
                                        size={24}
                                        onClick={() => confirmDelete(recording.key)}
                                        className="delete-icon"
                                    />
                                    <Share />
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
