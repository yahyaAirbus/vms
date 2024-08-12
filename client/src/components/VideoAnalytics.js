import React, { useState } from "react";
import axios from "axios";
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';


function VideoAnalytics() {
    const [analyticsEnabled, setAnalyticsEnabled] = useState("");

    const handleChange = async (event) => {
        const value = event.target.value;
        setAnalyticsEnabled(value);

        if (value === "yes") {
            try {
                // Make a POST request to the server to trigger the video analytics
                const response = await axios.post("/videoAnalytics", {
                    videoId: "your-video-id" // Replace with actual video ID or data
                });
                console.log("Analytics triggered:", response.data);
            } catch (error) {
                console.error("Error triggering analytics:", error);
            }
        }
    };

    return (
        <>
            <Box sx={{ minWidth: 460 }}>
                <FormControl fullWidth>
                    <label>Video Analytics</label>
                    <Select
                        id="video-analytics"
                        value={analyticsEnabled}
                        label="Video analytics"
                        onChange={handleChange}
                    >
                        <MenuItem value="Yes">yes</MenuItem>
                        <MenuItem value="No">No</MenuItem>
                    </Select>
                </FormControl>
            </Box>
        </>
    );
}

export default VideoAnalytics;
