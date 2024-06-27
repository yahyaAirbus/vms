import React, { useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { MdCheckCircle, MdCancel } from "react-icons/md";
import axios from 'axios';

const HLS_MANIFEST_URL_BASE = 'http://127.0.0.1:8083/stream/demoStream/channel';

const VideoStatus = ({ channelId }) => {
    const [status, setStatus] = useState({
        isChecking: true,
        isStreaming: false,
        isError: false,
    });

    useEffect(() => {
        const checkStreamStatus = async () => {
            setStatus({ isChecking: true, isStreaming: false, isError: false });
            try {
                const response = await axios.get(`${HLS_MANIFEST_URL_BASE}/${channelId}/hls/live/index.m3u8`);

                if (response.status === 200) {
                    setStatus({ isChecking: false, isStreaming: true, isError: false });
                } else {
                    setStatus({ isChecking: false, isStreaming: false, isError: true });
                }
            } catch (error) {
                setStatus({ isChecking: false, isStreaming: false, isError: true });
            }
        };

        const interval = setInterval(checkStreamStatus, 5000);
        checkStreamStatus();

        return () => clearInterval(interval);
    }, [channelId]);

    return (
        <div>
            {status.isChecking && (
                <p>
                    <a id="status">Status: </a>Checking... <AiOutlineLoading3Quarters className="loading-icon" />
                </p>
            )}
            {status.isStreaming && (
                <p>
                    <a id="status">Status: </a>Streaming <MdCheckCircle className="check-icon" />
                </p>
            )}
            {status.isError && (
                <p>
                    <a id="status">Status: </a>Unable to stream <MdCancel className="cancel-icon" />
                </p>
            )}
        </div>
    );
}

export default VideoStatus;
