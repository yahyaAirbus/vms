import React, { useState } from 'react';
import '../App.css';

function MultiSelect({ liveChannels, onSelectionChange }) {
    const [selectedChannels, setSelectedChannels] = useState([]);

    const handleChannelToggle = (channel) => {
        const updatedSelection = selectedChannels.includes(channel)
            ? selectedChannels.filter(ch => ch !== channel)
            : [...selectedChannels, channel];

        setSelectedChannels(updatedSelection);
        onSelectionChange(updatedSelection);
    };

    return (
        <div className="multi-select">
            <h3>Select Live Streams</h3>
            {liveChannels.map(({ channel }) => (
                <div key={channel} className="multi-select-item">
                    <input
                        type="checkbox"
                        id={channel}
                        checked={selectedChannels.includes(channel)}
                        onChange={() => handleChannelToggle(channel)}
                    />
                    <label htmlFor={channel}>{channel}</label>
                </div>
            ))}
        </div>
    );
}

export default MultiSelect;
