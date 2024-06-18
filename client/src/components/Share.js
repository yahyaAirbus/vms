import React from 'react';
import { PiShareFatFill } from "react-icons/pi";

function Share() {

    return (
        <div className="button-container">
            <button className="share" >
                <PiShareFatFill className="share-icon" />
                Share
            </button>
        </div>
    );
};

export default Share;