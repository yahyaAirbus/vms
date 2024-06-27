import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';
import { GiCctvCamera } from "react-icons/gi";
import Sidebar from '../components/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import '../App.css';

const Devices = () => {
    const [devices, setDevices] = useState([]);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:3001/name');
                setDevices(response.data.names);
            } catch (error) {
                console.error('Error fetching devices:', error);
            }
        };

        fetchDevices();
    }, []);

    const handleDelete = async (channel) => {
        try {
            await axios.delete(`http://127.0.0.1:3001/device/${channel}`);
            setDevices(devices.filter(device => device.channel !== channel));
            toast.success('Device deleted successfully');
        } catch (error) {
            console.error('Error deleting device:', error);
        }
    };

    const confirmDelete = (recordingKey) => {
        confirmDialog({
            message: 'Are you sure you want to delete this device?',
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => handleDelete(recordingKey),
            reject: () => toast.info('Deletion cancelled'),
            className: 'custom-confirm-dialog'
        });
    };
    return (
        <>
            <Sidebar />
            <div className='devices'>
                <div className="devices-content">
                    {devices.map(({ channel, name }) => (
                        <div key={channel} className="device-section">
                            <GiCctvCamera size={100} />
                            <h3>{name}</h3>
                            <FaTrash size={24} onClick={() => confirmDelete(channel)} className="delete-icon" />
                        </div>
                    ))}
                </div>
            </div>
            <ToastContainer />
            <ConfirmDialog />
        </>
    );
};

export default Devices