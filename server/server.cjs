const express = require("express");
const path = require('path');
const cors = require("cors");
const app = express();
const AWS = require("aws-sdk");
const axios = require("axios");
const { spawn } = require('child_process');
const PORT = 3001;
const fs = require("fs");
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const ytdl = require('ytdl-core');

require('dotenv').config();
app.use(express.json());
app.use(cors());

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

const cloudfront = 'https://d1gx8w5c0cotxv.cloudfront.net'

const docClient = new AWS.DynamoDB.DocumentClient(awsConfig);

app.use(express.static(path.join(__dirname, './client/build', 'index.html')));

app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, './client/build', 'index.html'));
});

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

        const externalApiUrl = `http://demo:demo@127.0.0.1:8083/stream/demo/channel/${newChannelId}/add`;
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

app.get('/test', (req, res) => {
    res.json("hello world")
})

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

        const externalApiUrl = `http://demo:demo@127.0.0.1:8083/stream/demo/channel/${channel}/delete`;
        await axios.get(externalApiUrl)

        res.status(200).json({ message: "Device deleted successfully" });
    } catch (err) {
        console.error("Error deleting device:", err);
        res.status(500).json({ message: "Error deleting device" });
    }
});

let outputFilename;
let ffmpegProcess;

app.post("/record/start", (req, res) => {
    const { channel } = req.body;
    if (!channel) {
        return res.status(400).json({ message: "Channel number is required" });
    }

    const m3u8Url = `http://127.0.0.1:8083/stream/demo/channel/${channel}/hls/live/index.m3u8`;

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

function startFFmpeg(channel) {
    if (ffmpegProcess) {
        ffmpegProcess.kill();
    }

    const hlsInputUrl = `http://127.0.0.1:8083/stream/demo/channel/1/hls/live/index.m3u8`;

    const ffmpegArgs = [
        '-loglevel', 'debug',
        '-i', hlsInputUrl,
        '-c:v', 'libx264',
        '-an',
        '-f', 'rtsp',
        '-rtsp_transport', 'tcp',
        'rtsp://216.24.57.252:8554/stream'
    ];

    ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

    ffmpegProcess.stdout.on('data', (data) => {
        console.log(`FFmpeg stdout: ${data}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
        console.error(`FFmpeg stderr: ${data}`);
    });

    ffmpegProcess.on('close', (code) => {
        console.log(`FFmpeg process exited with code ${code}`);
    });
}

app.post("/switch_stream", async (req, res) => {
    const { channel } = req.body;

    if (!channel) {
        return res.status(400).json({ message: "Channel number is required" });
    }

    try {
        startFFmpeg(channel);
        res.status(200).json({ message: `Switched to channel ${channel}` });
    } catch (err) {
        console.error("Error retrieving RTSP URL:", err);
        res.status(500).json({ message: "Error retrieving RTSP URL" });
    }
});

async function youtubeToRtsp(youtubeUrl, name) {
    try {
        const videoInfo = await ytdl.getInfo(youtubeUrl);
        const format = ytdl.chooseFormat(videoInfo.formats, { quality: 'highest' });
        const videoUrl = format.url;

        const ffmpegArgs = [
            '-loglevel', 'debug',
            '-i', videoUrl,
            '-c:v', 'libx264',
            '-profile:v', 'baseline',
            '-b:v', '512k',
            '-r', '15',
            '-g', '30',
            '-s', '640x480',
            '-an',
            '-f', 'rtsp',
            '-rtsp_transport', 'tcp',
            `rtsp://216.24.57.252:8554/${name}`
        ];

        const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

        ffmpegProcess.stdout.on('data', (data) => {
            console.log(`FFmpeg stdout: ${data}`);
        });

        ffmpegProcess.stderr.on('data', (data) => {
            console.error(`FFmpeg stderr: ${data}`);
        });

        ffmpegProcess.on('close', (code) => {
            console.log(`FFmpeg process exited with code ${code}`);
        });

        return Promise.resolve();
    } catch (err) {
        console.error(`ytdl-core error: ${err}`);
        return Promise.reject(`Error retrieving YouTube video URL: ${err}`);
    }
}

app.post('/youtube-to-rtsp', async (req, res) => {
    const { youtubeUrl, name } = req.body;

    if (!youtubeUrl || !name) {
        return res.status(400).json({ message: 'YouTube URL and name are required' });
    }

    try {
        const scanParams = {
            TableName: "demo_devices",
            ProjectionExpression: "channel"
        };

        const data = await docClient.scan(scanParams).promise();
        const maxChannelId = data.Items.length ? data.Items.reduce((maxId, item) => Math.max(maxId, item.channel), 0) : 0;
        const newChannelId = maxChannelId + 1;
        const rtspLink = `rtsp://5.tcp.eu.ngrok.io:10141/${name}`;
        const putParams = {
            TableName: "demo_devices",
            Item: {
                "channel": newChannelId,
                "name": name,
                "rtsp_url": rtspLink
            }
        };
        await docClient.put(putParams).promise();

        const externalApiUrl = `http://demo:demo@127.0.0.1:8083/stream/demo/channel/${newChannelId}/add`;
        const externalApiBody = {
            name: name,
            url: rtspLink,
            on_demand: false,
            debug: false,
            status: 0
        };

        await axios.post(externalApiUrl, externalApiBody, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        await youtubeToRtsp(youtubeUrl, name);

        res.status(200).json({ message: "Stream added successfully", channel: newChannelId });
    } catch (err) {
        console.error("Error adding stream:", err);
        res.status(500).json({ message: "Error adding stream" });
    }
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});