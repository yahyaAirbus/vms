import React from 'react';
import dayjs from 'dayjs';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

export default function TimeSelection({ startTime, setStartTime, endTime, setEndTime }) {
    return (
        <>
            <label className='time-selection'>Time Selection</label>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={['TimePicker', 'TimePicker']}>
                    <TimePicker
                        label="Start Time"
                        value={startTime}
                        onChange={(newValue) => setStartTime(newValue)}
                    />
                    <TimePicker
                        label="End Time"
                        value={endTime}
                        onChange={(newValue) => setEndTime(newValue)}
                    />
                </DemoContainer>
            </LocalizationProvider>
        </>
    );
}
