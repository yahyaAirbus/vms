import React from "react";
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

function VideoAnalytics({ onAnalyticsChange }) {
    const [analyticsEnabled, setAnalyticsEnabled] = React.useState("No");
    const [timeRange, setTimeRange] = React.useState({ startTime: null, endTime: null });


    const handleAnalyticsChange = (event) => {
        const value = event.target.value;
        setAnalyticsEnabled(value);
        onAnalyticsChange(value);
    };

    const handleTimeChange = (newTimeRange) => {
        setTimeRange(newTimeRange);
    };

    return (
        <Box sx={{ minWidth: 460 }}>
            <FormControl fullWidth>
                <label>Video Analytics</label>
                <Select
                    id="video-analytics"
                    value={analyticsEnabled}
                    label="Video Analytics"
                    onChange={handleAnalyticsChange}
                >
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                </Select>
            </FormControl>
        </Box>
    );
}

export default VideoAnalytics;
