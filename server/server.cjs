const express = require("express");
const path = require('path');
const cors = require("cors");
const app = express();
const AWS = require("aws-sdk");
const axios = require("axios");
const { exec } = require('child_process');
const PORT = 3001;
const fs = require("fs");
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { execSync } = require('child_process');
const { PythonShell } = require('python-shell')

require('dotenv').config();
app.use(express.json());
app.use(cors());

//AWS credentials to access data on was
const awsConfig = {
    region: "us-east-2",
    accessKeyId: process.env.AWS_Access_key,
    secretAccessKey: process.env.AWS_Secret_access_key
};

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_Access_key,
    secretAccessKey: process.env.AWS_Secret_access_key,
    region: "us-east-2"
});

//cloudfront link to access recording in S3 bucket
const cloudfront = 'https://d1gx8w5c0cotxv.cloudfront.net';

const docClient = new AWS.DynamoDB.DocumentClient(awsConfig);
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

//login endpoint
app.post("/Login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const params = {
        TableName: "demo_users",
        Key: {
            "email": email
        }
    };

    docClient.get(params, (err, data) => {
        if (err) {
            console.error("Error retrieving user data:", err);
            return res.status(500).json({ message: "Error retrieving user data" });
        } else {
            if (!data.Item) {
                return res.status(404).json({ message: "User not found" });
            }

            const userData = data.Item;
            if (userData.password === password) {
                return res.status(200).json({ message: "Login successful" });
            } else {
                return res.status(401).json({ message: "Invalid email or password" });
            }
        }
    });
});

//adding devices or streams to dynamoDB
app.post("/device", async (req, res) => {
    const { name, rtspUrl } = req.body;

    if (!name || !rtspUrl) {
        return res.status(400).json({ message: "Name and RTSP URL are required" });
    }

    try {
        const scanParams = {
            TableName: "demo_devices",
            ProjectionExpression: "channel"
        };

        const data = await docClient.scan(scanParams).promise();
        const maxChannelId = data.Items.length ? data.Items.reduce((maxId, item) => Math.max(maxId, item.channel), 0) : 0;
        const newChannelId = maxChannelId + 1;

        const putParams = {
            TableName: "demo_devices",
            Item: {
                "channel": newChannelId,
                "name": name,
                "rtsp_url": rtspUrl
            }
        };
        await docClient.put(putParams).promise();

        const externalApiUrl = `http://demo:demo@127.0.0.1:8083/stream/demoStream/channel/${newChannelId}/add`;
        const externalApiBody = {
            name: name,
            url: rtspUrl,
            on_demand: false,
            debug: false,
            status: 0
        };

        await axios.post(externalApiUrl, externalApiBody, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        res.status(200).json({ message: "Device added successfully", channel: newChannelId });
    } catch (err) {
        console.error("Error adding device:", err);
        res.status(500).json({ message: "Error adding device" });
    }
});

//retriving channel number from dynamoDB
app.get("/channel", async (req, res) => {
    try {
        const scanParams = {
            TableName: "demo_devices",
            ProjectionExpression: "channel"
        };

        const data = await docClient.scan(scanParams).promise();
        const liveChannels = data.Items.map(item => ({
            channel: item.channel
        }));

        res.status(200).json({ channels: liveChannels });
    } catch (err) {
        console.error("Error retrieving live channels:", err);
        res.status(500).json({ message: "Error retrieving live channels" });
    }
});

//retrieving streams names from dynamoDB
app.get("/name", async (req, res) => {
    try {
        const scanParams = {
            TableName: "demo_devices",
            ProjectionExpression: "channel, #n",
            ExpressionAttributeNames: {
                "#n": "name"
            }
        };

        const data = await docClient.scan(scanParams).promise();
        const deviceNames = data.Items.map(item => ({
            channel: item.channel,
            name: item.name
        }));
        res.status(200).json({ names: deviceNames });
    } catch (err) {
        console.error("Error retrieving device names:", err);
        res.status(500).json({ message: "Error retrieving device names" });
    }
});

//delete stream
app.delete("/device/:channel", async (req, res) => {
    const { channel } = req.params;

    const deleteParams = {
        TableName: "demo_devices",
        Key: {
            "channel": parseInt(channel)
        }
    };

    try {
        await docClient.delete(deleteParams).promise();

        const externalApiUrl = `http://demo:demo@127.0.0.1:8083/stream/demoStream/channel/${channel}/delete`;
        await axios.get(externalApiUrl);

        res.status(200).json({ message: "Device deleted successfully" });
    } catch (err) {
        console.error("Error deleting device:", err);
        res.status(500).json({ message: "Error deleting device" });
    }
});

let outputFilename;
let ffmpegProcess;

//record stream
app.post("/record/start", (req, res) => {
    const { channel } = req.body;
    if (!channel) {
        return res.status(400).json({ message: "Channel number is required" });
    }

    const m3u8Url = `http://127.0.0.1:8083/stream/demoStream/channel/${channel}/hls/live/index.m3u8`;

    const recordingId = uuidv4();
    outputFilename = `recording_${recordingId}.mp4`;

    const ffmpegCommand = `ffmpeg -i "${m3u8Url}" -t 60 -c:v libx264 -c:a aac ${outputFilename}`;
    ffmpegProcess = exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error during recording: ${error}`);
        }
        console.log(`Recording stdout: ${stdout}`);
        console.log(`Recording stderr: ${stderr}`);
    });

    res.status(200).json({ message: "Recording started" });
});

//stop the recording
app.post("/record/stop", async (req, res) => {
    if (ffmpegProcess) {
        ffmpegProcess.kill('SIGINT');
    }

    const params = {
        Bucket: 'airbusdemorecordings',
        Key: outputFilename,
        Body: fs.createReadStream(outputFilename),
        ContentType: 'video/mp4'
    };

    try {
        const uploadResult = await s3.upload(params).promise();
        console.log('Upload successful:', uploadResult.Location);
        fs.unlinkSync(outputFilename);
        res.status(200).json({ message: "Recording stopped and uploaded to S3", url: uploadResult.Location });
    } catch (error) {
        console.error('Error uploading recording to S3:', error);
        res.status(500).json({ message: "Error uploading recording to S3" });
    }
});

//retrieve recording
app.get('/recordings', async (req, res) => {
    const params = {
        Bucket: 'airbusdemorecordings',
    };

    try {
        const data = await s3.listObjectsV2(params).promise();
        const recordings = data.Contents.map(item => ({
            key: item.Key,
            url: `${cloudfront}/${item.Key}`
        }));
        res.json(recordings);
    } catch (error) {
        console.error('Error fetching recordings:', error);
        res.status(500).json({ message: 'Error fetching recordings' });
    }
});

//delete recording 
app.delete('/recordings/:key', (req, res) => {
    const key = req.params.key;
    const params = {
        Bucket: 'airbusdemorecordings',
        Key: key,
    };

    s3.deleteObject(params, (err, data) => {
        if (err) {
            console.error('Error deleting recording:', err);
            res.status(500).send('Error deleting recording');
        } else {
            res.status(200).send('Recording deleted successfully');
        }
    });
});

//stream to rtsp server
app.post("/switch_stream", async (req, res) => {
    const { channel } = req.body;

    if (!channel) {
        return res.status(400).json({ message: "Channel number is required" });
    }

    try {
        await axios.post('http://localhost:8084/switch_stream', { channel });
        res.status(200).json({ message: `Switched to channel ${channel}` });
    } catch (error) {
        console.error('Error switching stream:', error);
        res.status(500).json({ message: "Error switching stream" });
    }
});

//extreact HLS link from from a regualr youtube link
async function getHlsLinkFromYoutube(youtubeUrl) {
    try {
        const command = `yt-dlp -g "${youtubeUrl}"`;
        const result = execSync(command, { encoding: 'utf8' }).trim();
        return result;
    } catch (err) {
        console.error(`yt-dlp error: ${err}`);
        throw new Error(`Error retrieving HLS URL: ${err}`);
    }
}

//convert HLS to RTSP to stream it to rtsp server
async function hlsToRtsp(hlsUrl, name) {
    return new Promise((resolve, reject) => {
        const rtsp_url = `rtsp://3.142.212.147:8554/test`;
        const ffmpegCommand = `ffmpeg -re -i "${hlsUrl}" -c:v copy -f rtsp "${rtsp_url}"`;

        exec(ffmpegCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error streaming HLS to RTSP: ${stderr}`);
                reject(`Error streaming HLS to RTSP: ${stderr}`);
                return;
            }
            resolve(rtsp_url);
        });
    });
}

//adding youtube videos to DynamoDB
app.post('/youtube-to-rtsp', async (req, res) => {
    const { youtubeUrl, name } = req.body;

    if (!youtubeUrl || !name) {
        return res.status(400).json({ message: 'YouTube URL and name are required' });
    }

    try {
        const hlsUrlPromise = getHlsLinkFromYoutube(youtubeUrl);
        const hlsUrl = await hlsUrlPromise;
        console.log(`HLS URL: ${hlsUrl}`);

        const rtspUrlPromise = hlsToRtsp(hlsUrl, name);
        const rtspUrl = await rtspUrlPromise;
        console.log(`RTSP URL: ${rtspUrl}`);

        const scanParams = {
            TableName: "demo_devices",
            ProjectionExpression: "channel"
        };

        const dataPromise = docClient.scan(scanParams).promise();
        const data = await dataPromise;
        const maxChannelId = data.Items.length ? data.Items.reduce((maxId, item) => Math.max(maxId, item.channel), 0) : 0;
        const newChannelId = maxChannelId + 1;

        const putParams = {
            TableName: "demo_devices",
            Item: {
                "channel": newChannelId,
                "name": name,
                "rtsp_url": rtspUrl
            }
        };
        const putPromise = docClient.put(putParams).promise();
        await putPromise;

        const externalApiUrl = `http://demo:demo@3.142.212.147:8083/stream/demoStream/channel/${newChannelId}/add`;
        const externalApiBody = {
            name: name,
            url: rtspUrl,
            on_demand: false,
            debug: false,
            status: 0
        };

        console.log(`Sending request to external API: ${externalApiUrl}`);
        const axiosPromise = axios.post(externalApiUrl, externalApiBody, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        await axiosPromise;

        console.log("External API request successful");

        res.status(200).json({ message: "Stream added successfully", channel: newChannelId });
    } catch (err) {
        console.error("Error adding stream:", err);
        res.status(500).json({ message: "Error adding stream", error: err });
    }
});

//add recording from local computer to S3 bucket
app.post('/add-recording', upload.single('video'), async (req, res) => {
    const videoFile = req.file;

    if (!videoFile) {
        return res.status(400).json({ message: 'No video file uploaded' });
    }

    // Define S3 upload parameters
    const params = {
        Bucket: 'airbusdemorecordings',
        Key: videoFile.filename,  // This is the "recordingKey" we need
        Body: fs.createReadStream(videoFile.path),
        ContentType: 'video/mp4'
    };

    try {
        // Create an S3 upload instance with a progress callback
        const upload = s3.upload(params);

        // Track progress using the `httpUploadProgress` event
        upload.on('httpUploadProgress', (progress) => {
            const progressPercentage = Math.round((progress.loaded / progress.total) * 100);
            console.log(`Upload Progress: ${progressPercentage}%`);

            // Optional: Send progress updates back to the client via WebSockets or Server-Sent Events (SSE)
            // For now, we are just logging it on the server-side
        });

        // Wait for the upload to complete
        const uploadResult = await upload.promise();
        console.log('Upload successful:', uploadResult.Location);

        // Remove the file from local storage after upload
        fs.unlinkSync(videoFile.path);

        // Send response with the recording key
        res.status(200).json({
            message: 'Video uploaded to S3',
            url: uploadResult.Location,
            recordingKey: videoFile.filename  // Include the recordingKey in the response
        });
    } catch (error) {
        console.error('Error uploading video to S3:', error);
        res.status(500).json({ message: 'Error uploading video to S3' });
    }
});

//stream recording to rtsp server
app.post('/share-recording/:recordingKey', async (req, res) => {
    const recordingKey = req.params.recordingKey;
    try {
        const params = {
            Bucket: "airbusdemorecordings",
            Key: recordingKey
        };
        const videoUrl = `${cloudfront}/${recordingKey}`;
        await axios.post("http://localhost:8084/share-recording", { videoUrl });
        res.status(200).json({ message: 'Video URL shared successfully', videoUrl });
    } catch (error) {
        console.error('Error sharing recording:', error.message);
        res.status(500).json({ message: 'Error sharing recording' });
    }
});

// Endpoint to start video analytics for live videos
app.post('/rtsp-analytics', (req, res) => {
    const { channel } = req.body;
    res.json({ message: `Request received, and the channel is ${channel}` });
    const scriptPath = '/Users/yahya/Desktop/prog/vms/server/movement_detection/main.py';
    const options = {
        pythonPath: '/Users/yahya/Desktop/prog/vms/server/venv/bin/python',
        args: [`--video`, `http://127.0.0.1:8083/stream/demoStream/channel/${channel}/hls/live/index.m3u8`]
    };

    PythonShell.run(scriptPath, options, (err, result) => {
        if (err) {
            console.error('Error executing script:', err);
            return res.status(500).json({ error: 'Failed to trigger video analytics' });
        }
        console.log('Script result:', result);
        res.json({ message: 'Video analytics started successfully', output: result });
    });
});

// Endpoint to start video analytics for recorded videos
app.post('/recording-analytics', (req, res) => {
    const { recordingKey } = req.body;

    res.json({ message: `Request received for recording key: ${recordingKey}` });

    const scriptPath = '/Users/yahya/Desktop/prog/vms/server/movement_detection/main.py';
    const options = {
        pythonPath: '/Users/yahya/Desktop/prog/vms/server/venv/bin/python',
        args: ['--video', `${cloudfront}/${recordingKey}`]
    };

    PythonShell.run(scriptPath, options, (err, result) => {
        if (err) {
            console.error('Error executing script:', err);
            return res.status(500).json({ error: 'Failed to trigger video analytics' });
        }
        console.log('Script result:', result);
        res.json({ message: 'Video analytics started successfully', output: result });
    });
});

//testing if the server is running 
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});