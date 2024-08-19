import React from "react";
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import TimeSelection from "./TimeSelection";

function VideoAnalytics({ onAnalyticsChange }) {
    const [analyticsEnabled, setAnalyticsEnabled] = React.useState("No");

    // Call the provided callback to update the parent component
    const handleChange = (event) => {
        const value = event.target.value;
        setAnalyticsEnabled(value);
        onAnalyticsChange(value)
    };

    return (
        <Box sx={{ minWidth: 460 }}>
            <FormControl fullWidth>
                <label>Video Analytics</label>
                <Select
                    id="video-analytics"
                    value={analyticsEnabled}
                    label="Video analytics"
                    onChange={handleChange}
                >
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                </Select>
                <TimeSelection />
            </FormControl>
        </Box>

    );
}

export default VideoAnalytics;
