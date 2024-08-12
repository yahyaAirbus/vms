import React from 'react';
import Sidebar from '../components/Sidebar';
import AddDeviceForm from '../components/AddDeviceform';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function AddDevice() {
    return (
        <div>
            <Sidebar />
            <AddDeviceForm />
            <ToastContainer />
        </div>
    );
}

export default AddDevice;
