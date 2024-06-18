import React from 'react';
import AddExternalVid from '../components/AddExternalVid';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ExternalLiveVid() {
    return (
        <div>
            <AddExternalVid />
            <ToastContainer />
        </div>
    );
}

export default ExternalLiveVid;
