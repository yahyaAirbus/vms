import cv2
import time
import imutils
import numpy as np
import os
from datetime import datetime, timedelta
import requests
import json
from dotenv import load_dotenv
import base64
from PIL import Image
from io import BytesIO

load_dotenv()

#import gradio as gr

# Environment variables to get Smartwisp token
AGNET_USERNAME = os.environ.get('AGNET_USERNAME')
AGNET_PASSWORD = os.environ.get('AGNET_PASSWORD')
AGNET_CLIENT_ID = os.environ.get('AGNET_CLIENT_ID')
MSISDN = os.environ.get('MSISDN')

# Function to get token from Smartwisp
def auth(username, password, client_secret):
    print("[INFO] Authenticating with Smartwisp...")
    url = "https://openid-keycloak-test.tactilon-smartwisp.com/auth/realms/master/protocol/openid-connect/token"
    data = {
        'username': username,
        'password': password,
        'grant_type': 'password',
        'client_id': 'kong',
        'client_secret': client_secret,
    }
    response = requests.post(url, data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
    token = json.loads(response.text)['access_token']
    print("[INFO] Authentication successful")
    return token

# Function to send emergency alert to dispatcher
def send_emergency_message(bearer_token, recipient_msisdn):
    url = f'https://api.ea-1.eu-west-1.agnet.com/api/v2/subscriber/{recipient_msisdn}/message/emergency?filter=sendEmergency'
    headers = {
        'Authorization': f'Bearer {bearer_token}',
        'Content-Type': 'application/json'
    }
    data = {
        "Message": {
            "Severity": "custom",
            "EmergencyTitle": "Emergency Alert",
            "Text": "Human movement detected!",
            "Location": {
                "Latitude": 60.219824,  
                "Longitude": 24.870848 
            }
        }
    }
    try:
        response = requests.post(url, headers=headers, json=data)

        if response.status_code == 200 or response.status_code == 201:
            print("Emergency message sent successfully")
            print("Response content:")
            print(response.json())
        else:
            print(f"Failed to send emergency message. Status code: {response.status_code}")
            print(response.text)
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

#send message to dispatcher to with screenshots of the movement detected
def send_message(bearer_token, sender_msisdn, image):

    with open(image, 'rb') as image_file:
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')

    url = f'https://api.ea-1.eu-west-1.agnet.com/api/v2/subscriber/{sender_msisdn}/message'
    headers = {
        'Authorization': f'Bearer {bearer_token}',
        'Content-Type': 'application/json'
    }
    data = {
        "Message": {
            "Text": "movement detected",
            "Recipients": [{"Msisdn": "35840123456"}],
            "IsGroupMessage": False,
            "Attachment": {
                "Content": base64_image,
                "FileName": "evidence"
            },
            "Bearer": "NFC",
            "AvailableOnlyRecipients": False,
            "RequiresAcknowledge": False
        },
        "DeleteAfterSending": False
    }

    try:
        response = requests.post(url, headers=headers, json=data)

        if response.status_code == 200 or response.status_code == 201:
            print("Message sent successfully")
            print("Response content:")
            print(response.json())
        else:
            print(f"Failed to send message. Status code: {response.status_code}")
            print(response.text)
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

'''''
if __name__ == "__main__":
    send_emergency_message(auth(AGNET_USERNAME, AGNET_PASSWORD, AGNET_CLIENT_ID), "358408346118")
    send_message(auth(AGNET_USERNAME, AGNET_PASSWORD, AGNET_CLIENT_ID), "358408346118")
'''''


# Function to get frame from the video stream
def getFrame(url, vs):
    print(f"[INFO] Fetching frame from stream: {url}")
    if vs is None:
        vs = cv2.VideoCapture(url)
    return vs

# Function to detect objects in the frame
def getDetection(args, smallFrame):
    net.setInput(cv2.dnn.blobFromImage(smallFrame, 0.007843, (300, 300), 127.5))
    detections = net.forward()
    for i in np.arange(0, detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > args['confidence']:
            idx = int(detections[0, 0, i, 1])
            if CLASSES[idx] == "person":
                print("[INFO] Person detected with confidence:", confidence)
                return True, smallFrame
    return False, None

# Function to fetch live stream URLs
def fetch_live_stream_urls():
    print("[INFO] Fetching live stream URLs...")
    response = requests.get("http://demo:demo@127.0.0.1:8083/streams")
    if response.status_code == 200:
        streams = response.json().get("payload", {})
        urls = []
        for stream_name, stream_info in streams.items():
            channels = stream_info.get("channels", {})
            for channel_id, channel_info in channels.items():
                url = channel_info.get("url")
                if url:
                    urls.append(url)
        print("[INFO] Successfully fetched stream URLs:", urls)
        return urls
    else:
        print("[ERROR] Error fetching stream URLs, status code:", response.status_code)
        return []

# Load the pre-trained model
print("[INFO] Loading pre-trained model...")
net = cv2.dnn.readNetFromCaffe("mobilenet_ssd/MobileNetSSD_deploy.prototxt", "mobilenet_ssd/MobileNetSSD_deploy.caffemodel")
print("[INFO] Model loaded successfully")

# Define the classes for object detection
CLASSES = ["background", "aeroplane", "bicycle", "bird", "boat", "bottle", "bus", "car", "cat", "chair", "cow", "diningtable", 
           "dog", "horse", "motorbike", "person", "pottedplant", "sheep", "sofa", "train", "tvmonitor"]

# Parameters for detection
args = {
    "confidence": 0.7,
    "skip_frames": 10,
    "view": False,
    "threshold": 4000
}

# Variables for processing
W, H = None, None
totalFrames, newImage, smallFrame = 0, None, None
image_sent = datetime.now() - timedelta(minutes=1)
found, avg = False, None
outVideo = None

# Fetch the live stream URLs
stream_urls = fetch_live_stream_urls()
if not stream_urls:
    print("[ERROR] No stream URLs found")
else:
    def process_frame():
        for url in stream_urls:
            print(f"[INFO] Processing stream: {url}")
            vs = getFrame(url, None)
    
            while True:
                notToSkip = totalFrames % args["skip_frames"] == 0
                if cv2.waitKey(10) & 0xFF == ord('q'):
                    print("[INFO] Quit signal received, exiting...")
                    break
                rt, frame = vs.read()
                if not rt:
                    print("[WARN] Frame read unsuccessful, restarting stream...")
                    totalFrames = 0
                    if outVideo:
                        outVideo.release()
                        outVideo = None
                    vs = getFrame(url, None)
                    continue
                if notToSkip:
                    smallFrame = imutils.resize(frame, width=500)
                    grey = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    grey = cv2.GaussianBlur(grey, (21, 21), 0)
    
                    if avg is None or totalFrames > 600:
                        totalFrames = 0
                        print("[INFO] Starting background model...")
                        avg = grey.copy().astype("float")
                        continue
    
                    cv2.accumulateWeighted(grey, avg, 0.5)
                    frameDelta = cv2.absdiff(grey, cv2.convertScaleAbs(avg))
    
                    thresh = cv2.threshold(frameDelta, 5, 255, cv2.THRESH_BINARY)[1]
                    thresh = cv2.dilate(thresh, None, iterations=2)
                    (cnts, _) = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
                    motion = False
                    for c in cnts:
                        if cv2.contourArea(c) < args['threshold']:
                            continue
    
                        (x, y, w, h) = cv2.boundingRect(c)
                        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                        motion = True
                        break
    
                    if motion:
                        print("[INFO] Motion detected...")
                        totalFrames = 0
                        rgb = cv2.cvtColor(smallFrame, cv2.COLOR_BGR2RGB)
                        if W is None or H is None:
                            (H, W) = smallFrame.shape[:2]
                        found, newImage = getDetection(args, smallFrame)
    
                if found:
                    cur = datetime.now()
                    checkcur = cur - timedelta(minutes=1)
                    if checkcur > image_sent:
                        image_sent = cur
                        send_emergency_message(auth(AGNET_USERNAME, AGNET_PASSWORD, AGNET_CLIENT_ID),"358408346118")
                        send_message(auth(AGNET_USERNAME, AGNET_PASSWORD, AGNET_CLIENT_ID), "358408346118", image_sent)
                        width = int(vs.get(cv2.CAP_PROP_FRAME_WIDTH))
                        height = int(vs.get(cv2.CAP_PROP_FRAME_HEIGHT))
                        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                        timestr = time.strftime("%Y%m%d-%H%M%S.mp4")
                        timestr = "HumanDetectionRecord/" + timestr
                        if not outVideo:
                            outVideo = cv2.VideoWriter(timestr, fourcc, 15.0, (width, height))
                            print("[INFO] Started recording video:", timestr)
    
                if args["view"]:
                    cv2.imshow('frame', frame)
                    if newImage is not None:
                        cv2.imshow('newImage', newImage)
                    if grey is not None:
                        cv2.imshow('grey', grey)
    
                if outVideo:
                    outVideo.write(frame)
                    if not found and not motion:
                        print("[INFO] Stopping video recording")
                        outVideo.release()
                        outVideo = None
                totalFrames += 1

                yield frame, newImage

            if vs is not None:
                vs.release()
            cv2.destroyAllWindows()
        print("[INFO] Finished processing all streams")


if __name__ == "__main__":
   process_frame()
