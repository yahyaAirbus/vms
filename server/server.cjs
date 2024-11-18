const express = require("express");
const cors = require("cors");
const app = express();
const axios = require("axios");
const { exec } = require('child_process');
const { spawn } = require('child_process');
const PORT = 3001;
const fs = require("fs");
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { execSync } = require('child_process');
const { PythonShell } = require('python-shell')
const cron = require("node-cron")
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezoneIana = require('dayjs-timezone-iana-plugin');

dayjs.extend(utc);
dayjs.extend(timezoneIana);

require('dotenv').config();
app.use(express.json());
app.use(cors());

const publicVmIp = process.env.REACT_APP_VM_IP_PUBLIC;
const privateVmIp = process.env.REACT_APP_VM_IP_PRIVATE;

const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { default: ffmpeg } = require("ffmpeg");
const { url } = require("inspector");

const awsConfig = {
    region: "us-east-2",
    credentials: {
        accessKeyId: process.env.AWS_Access_key,
        secretAccessKey: process.env.AWS_Secret_access_key
    }
};

const s3Client = new S3Client(awsConfig);
const ddbClient = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(ddbClient);

const cloudfront = 'https://d1gx8w5c0cotxv.cloudfront.net';

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

// Login endpoint
app.post("/Login", async (req, res) => {
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

    try {
        const data = await docClient.send(new GetCommand(params));
        if (!data.Item) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = data.Item;
        if (userData.password === password) {
            return res.status(200).json({ message: "Login successful" });
        } else {
            return res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (err) {
        console.error("Error retrieving user data:", err);
        return res.status(500).json({ message: "Error retrieving user data" });
    }
});

// Adding devices or streams to DynamoDB
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

        const data = await docClient.send(new ScanCommand(scanParams));
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
        await docClient.send(new PutCommand(putParams));

        const externalApiUrl = `http://demo:demo@rtsp-to-web:8083/stream/demoStream/channel/${newChannelId}/add`;
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

// Retrieving channel number from DynamoDB
app.get("/channel", async (req, res) => {
    try {
        const scanParams = {
            TableName: "demo_devices",
            ProjectionExpression: "channel"
        };

        const data = await docClient.send(new ScanCommand(scanParams));
        const liveChannels = data.Items.map(item => ({
            channel: item.channel
        }));

        res.status(200).json({ channels: liveChannels });
    } catch (err) {
        console.error("Error retrieving live channels:", err);
        res.status(500).json({ message: "Error retrieving live channels" });
    }
});

// Retrieving streams names from DynamoDB
app.get("/name", async (req, res) => {
    try {
        const scanParams = {
            TableName: "demo_devices",
            ProjectionExpression: "channel, #n",
            ExpressionAttributeNames: {
                "#n": "name"
            }
        };

        const data = await docClient.send(new ScanCommand(scanParams));
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

// Delete stream
app.delete("/device/:channel", async (req, res) => {
    const { channel } = req.params;

    const deleteParams = {
        TableName: "demo_devices",
        Key: {
            "channel": parseInt(channel)
        }
    };

    try {
        await docClient.send(new DeleteCommand(deleteParams));

        const externalApiUrl = `http://demo:demo@rtsp-to-web:8083/stream/demoStream/channel/${channel}/delete`;
        await axios.get(externalApiUrl);

        res.status(200).json({ message: "Device deleted successfully" });
    } catch (err) {
        console.error("Error deleting device:", err);
        res.status(500).json({ message: "Error deleting device" });
    }
});

let outputFilename;
let ffmpegProcess;

// Record stream
app.post("/record/start", async (req, res) => {
    const { channel } = req.body;
    if (!channel) {
        return res.status(400).json({ message: "Channel number is required" });
    }

    const m3u8Url = `http://${publicVmIp}:8083/stream/demoStream/channel/${channel}/hls/live/index.m3u8`;

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

// Stop the recording
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
        const uploadCommand = new PutObjectCommand(params);
        await s3Client.send(uploadCommand);
        console.log('Upload successful');

        fs.unlinkSync(outputFilename);
        res.status(200).json({ message: "Recording stopped and uploaded to S3", url: `https://${params.Bucket}.s3.amazonaws.com/${params.Key}` });
    } catch (error) {
        console.error('Error uploading recording to S3:', error);
        res.status(500).json({ message: "Error uploading recording to S3" });
    }
});

// Retrieve recordings
app.get('/recordings', async (req, res) => {
    const params = {
        Bucket: 'airbusdemorecordings',
    };

    try {
        const listCommand = new ListObjectsV2Command(params);
        const data = await s3Client.send(listCommand);
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

// Delete recording 
app.delete('/recordings/:key', async (req, res) => {
    const key = req.params.key;
    const params = {
        Bucket: 'airbusdemorecordings',
        Key: key,
    };

    try {
        const deleteCommand = new DeleteObjectCommand(params);
        await s3Client.send(deleteCommand);
        res.status(200).send('Recording deleted successfully');
    } catch (err) {
        console.error('Error deleting recording:', err);
        res.status(500).send('Error deleting recording');
    }
});

// Stream to RTSP server
app.post("/switch_stream", async (req, res) => {
    const { channel } = req.body;

    if (!channel) {
        return res.status(400).json({ message: "Channel number is required" });
    }

    try {
        await axios.post(`http://${privateVmIp}:8084/switch_stream`, { channel });
        res.status(200).json({ message: `Switched to channel ${channel}` });
    } catch (error) {
        console.error('Error switching stream:', error);
        res.status(500).json({ message: "Error switching stream" });
    }
});

// Extract HLS link from a regular YouTube link
async function getHlsLinkFromYoutube(youtubeUrl) {
    try {
        const command = `yt-dlp -g ${youtubeUrl}`;
        const result = execSync(command, { encoding: 'utf8' }).trim();
        return result;
    } catch (err) {
        console.error(`yt-dlp error: ${err}`);
        throw new Error(`Error retrieving HLS URL: ${err}`);
    }
}

// Convert HLS to RTSP to stream it to RTSP server
function hlsToRtsp(hlsUrl, name) {
    return new Promise((resolve, reject) => {
        const rtspUrl = `rtsp://${privateVmIp}:8554/${name}`;
        const vlcArgs = [
            hlsUrl,
            '--sout', `#transcode{vcodec=h264,vb=15000,acodec=none}:rtp{sdp=${rtspUrl}}`,
            `--rtsp-host=rtsp-server`,
            '--no-audio',
            '--intf', 'dummy',
            '--rtsp-port', '8554',
            '--ttl', '1',
            '--sout-rtp-caching', '500'
        ];

        const vlcProcess = spawn('vlc', vlcArgs);

        vlcProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        vlcProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        vlcProcess.on('close', (code) => {
            if (code === 0) {
                resolve(rtspUrl);
            } else {
                reject(`VLC process exited with code ${code}`);
            }
        });

        vlcProcess.on('error', (error) => {
            reject(`Error starting VLC: ${error}`);
        });
    });
}

// Adding YouTube videos to DynamoDB
app.post('/youtube-to-rtsp', async (req, res) => {
    const { youtubeUrl, name } = req.body;

    if (!youtubeUrl || !name) {
        return res.status(400).json({ message: 'YouTube URL and name are required' });
    }

    try {
        const hlsUrl = await getHlsLinkFromYoutube(youtubeUrl);
        console.log(`HLS URL: ${hlsUrl}`);

        const rtspUrl = await hlsToRtsp(hlsUrl, name);
        console.log(`RTSP URL: ${rtspUrl}`);

        const scanParams = {
            TableName: "demo_devices",
            ProjectionExpression: "channel"
        };

        const data = await docClient.send(new ScanCommand(scanParams));
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
        await docClient.send(new PutCommand(putParams));

        const externalApiUrl = `http://demo:demo@rtsp-to-web:8083/stream/demoStream/channel/${newChannelId}/add`;
        const externalApiBody = {
            name: name,
            url: rtspUrl,
            on_demand: false,
            debug: false,
            status: 0
        };

        console.log(`Sending request to external API: ${externalApiUrl}`);
        await axios.post(externalApiUrl, externalApiBody, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log("External API request successful");

        res.status(200).json({ message: "Stream added successfully", channel: newChannelId });
    } catch (err) {
        console.error("Error adding stream:", err);
        res.status(500).json({ message: "Error adding stream", error: err.message });
    }
});

// Add recording from local computer to S3 bucket
app.post('/add-recording', upload.single('video'), async (req, res) => {
    const videoFile = req.file;

    if (!videoFile) {
        return res.status(400).json({ message: 'No video file uploaded' });
    }

    const params = {
        Bucket: 'airbusdemorecordings',
        Key: videoFile.filename,
        Body: fs.createReadStream(videoFile.path),
        ContentType: 'video/mp4'
    };

    try {
        const putCommand = new PutObjectCommand(params);
        await s3Client.send(putCommand);
        console.log('Upload successful');
        fs.unlinkSync(videoFile.path);

        res.status(200).json({
            message: 'Video uploaded to S3',
            url: `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`,
            recordingKey: videoFile.filename
        });
    } catch (error) {
        console.error('Error uploading video to S3:', error);
        res.status(500).json({ message: 'Error uploading video to S3' });
    }
});

// Stream recording to RTSP server to view it on agent
app.post('/share-recording/:recordingKey', async (req, res) => {
    const recordingKey = req.params.recordingKey;
    try {
        const videoUrl = `${cloudfront}/${recordingKey}`;
        await axios.post(`http://${privateVmIp}:8084/share-recording`, { videoUrl });
        res.status(200).json({ message: 'Video URL shared successfully', videoUrl });
    } catch (error) {
        console.error('Error sharing recording:', error.message);
        res.status(500).json({ message: 'Error sharing recording' });
    }
});

let scheduledJob = null;

// Endpoint to trigger the movement detection for live streams
app.post('/rtsp-analytics', (req, res) => {
    const { channel, startTime, endTime, timezone } = req.body;

    const start = dayjs(startTime).tz(timezone);
    const end = dayjs(endTime).tz(timezone);

    const durationInMilliseconds = end.diff(start);

    if (scheduledJob) {
        scheduledJob.stop();
    }

    scheduledJob = cron.schedule(`${start.minute()} ${start.hour()} * * *`, () => {
        console.log('Starting Python script for RTSP stream...');

        const pythonProcess = spawn('/server/venv/bin/python', [
            '/server/movement_detection/main.py',
            '--video', `http://${publicVmIp}:8083/stream/demoStream/channel/${channel}/hls/live/index.m3u8`
        ]);

        pythonProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python script exited with code ${code}`);
        });

        setTimeout(() => {
            console.log('Stopping Python script...');
            pythonProcess.kill('SIGTERM');
        }, durationInMilliseconds);
    }, {
        scheduled: true,
        timezone: timezone
    });

    res.json({ message: `RTSP video analytics scheduled from ${start.format('HH:mm')} to ${end.format('HH:mm')} in timezone ${timezone}` });
});

// Endpoint to trigger the movement detection for recordings 
app.post('/recording-analytics', (req, res) => {
    const { recordingKey, startTime, endTime, timezone } = req.body;
    const start = dayjs(startTime).tz(timezone);
    const end = dayjs(endTime).tz(timezone);
    const durationInMilliseconds = end.diff(start);

    scheduledJob = cron.schedule(`${start.minute()} ${start.hour()} * * *`, () => {
        console.log('Starting Python script for recorded video...');

        const pythonProcess = spawn('/server/venv/bin/python', [
            '/server/movement_detection/main.py',
            '--video',
            `${cloudfront}/${recordingKey}`
        ]);

        pythonProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python script exited with code ${code}`);
        });

        setTimeout(() => {
            console.log('Stopping Python script...');
            pythonProcess.kill('SIGTERM');
        }, durationInMilliseconds);
    }, {
        scheduled: true,
        timezone: timezone
    });

    res.json({ message: `Video analytics for recording scheduled from ${start.format('HH:mm')} to ${end.format('HH:mm')} in timezone ${timezone}` });
});


app.post('/multiple-streams', async (req, res) => {
    const { channels } = req.body;

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
        return res.status(400).json({ message: "An array of channel numbers is required" });
    }
    try {
        await axios.post(`http://${privateVmIp}:8084/multiple-streams`, { channels }, {
            headers: { 'Content-Type': 'application/json' }
        });
        res.status(200).json({ message: `Streaming the following channels: ${channels.join(", ")}` });
    }
    catch (error) {
        console.error('Error sharing stream:', error);
        res.status(500).json({ message: "Error streaming multiple live videos" });
    }
});


app.post('/multiple-recodings', async (req, res) => {
    const recodingKeys = req.body
    if (!recodingKeys) {
        return res.status(400).json({ message: "recording keys are required" });
    }
    try {
        await axios.post(`http://${privateVmIp}:8084/multiple-recordings/:`, { channels })
        res.status(200).json({ message: `streamed the following recordings ${recodingKeys}` })
    }
    catch (error) {
        console.error('Error sharing recording', error);
        res.status(500).json({ message: 'Error streaming multiple recodings' })
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
