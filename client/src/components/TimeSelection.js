import React from 'react';
import dayjs from 'dayjs';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import '../App.css';

export default function TimeSelection({ analyticsEnabled }) {
    const [value, setValue] = React.useState(dayjs('2022-04-17T15:30'));

    return (
        <>
            <label className='time-selection'>Time Selection</label>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={['TimePicker', 'TimePicker']}>
                    <TimePicker
                        disabled={analyticsEnabled !== "Yes"}
                        defaultValue={dayjs('2022-04-17T15:30')}
                    />
                    <TimePicker
                        disabled={analyticsEnabled !== "Yes"}
                        value={value}
                        onChange={(newValue) => setValue(newValue)}
                    />
                </DemoContainer>
            </LocalizationProvider>
        </>
    );
}
