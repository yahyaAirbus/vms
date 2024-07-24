import cv2
import argparse
import sys
import time
import imutils
import numpy as np
import os
from datetime import datetime, timedelta
import requests
import json
import gradio as gr

# initialize the list of class labels MobileNet SSD was trained to
# detect
CLASSES = ["background", "aeroplane", "bicycle", "bird", "boat",
	"bottle", "bus", "car", "cat", "chair", "cow", "diningtable",
	"dog", "horse", "motorbike", "person", "pottedplant", "sheep",
	"sofa", "train", "tvmonitor"]

#get token form Smartwisp
def auth(username, password, client_secret):

    url = "https://openid-keycloak-test.tactilon-smartwisp.com/auth/realms/master/protocol/openid-connect/token"
    data = {'username': username,
            'password': password,
            'grant_type': 'password',
            'client_id': 'kong',
            'client_secret': client_secret,
            }
    response = requests.post(url, data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})

    token = json.loads(response.text)['access_token']

    return token

#Send emergency alert to dispatcher
def send_alert():
    method_url = 'https://api.ea-1.eu-west-1.agnet.com/api/v2/subscriber/35840789456/message'
    token = auth('yahya.khafif@airbus.com', 'JamilaOuahidy1234', 'cb59044f-f674-455c-8798-ee11c169c861')
    body = {
        'Message': {
            'Text': 'dispatch test',
            'Recipients': [{'Msisdn': '35840321654'}],
            'IsGroupMessage': False,
            'Bearer': "NFC",
            'AvailableOnlyRecipients': False,
            'RequiresAcknowledge': True
        },
        'DeleteAfterSending': False
    }

    headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    }

    response = requests.post(method_url, json=body, headers=headers)

    feedback = json.loads(response.text)

    print(feedback)

    return

#send image to dispatcher when there's movement detected
def send_image():
    method_url = 'https://api.ea-1.eu-west-1.agnet.com/api/v2/subscriber/35840789456/message'
    token = auth('yahya.khafif@airbus.com', 'JamilaOuahidy1234', 'cb59044f-f674-455c-8798-ee11c169c861')
    body = {
        'Message': {
            'Text': 'dispatch test',
            'Recipients': [{'Msisdn': '35840321654'}],
            'IsGroupMessage': False,
            'Bearer': "NFC",
            'AvailableOnlyRecipients': False,
            'RequiresAcknowledge': True
        },
        'DeleteAfterSending': False
    }

    headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    }
    

def getCamera(url):
    while True:
        try:
            print("getting camera ", url)
            if cv2.waitKey(10) & 0xFF == ord('q'):
                break
            vs = cv2.VideoCapture(url)  # Open video stream
            rs, frame = vs.read()  # Read frame
            if not rs:
                print("error camera no frame:")
                time.sleep(5.0)  # Wait for 5 seconds if no frame

            print("got camera at ", datetime.now())
            sys.stdout.flush()
            return vs  # Return video stream object
        except Exception as e:
            print("error camera", str(e))
            time.sleep(4.0)  # Wait for 4 seconds if there's an exception

# Function to get a frame from the camera
def getFrame(url, vs):
    if not vs:
        vs = getCamera(url)  # Get camera if not already available
    while True:
        rs = vs.grab()  # Grab a frame
        if rs:
            return vs  # Return video stream object if frame is grabbed
        else:
            print("can't get at ", datetime.now())
            vs.release()  # Release the video stream
            vs = getCamera(url)  # Get the camera again

# Function to get detections from a frame
def getDetection(args, smallFrame):
    blob = cv2.dnn.blobFromImage(smallFrame, 0.007843, (W, H), 127.5)  # Create a blob from the image
    net.setInput(blob)  # Set the input to the network
    detections = net.forward()  # Get the detections from the network
    trackers = []
    image = smallFrame
    found = False
    # Loop over the detections
    for i in np.arange(0, detections.shape[2]):
        confidence = detections[0, 0, i, 2]  # Get the confidence of the detection
        # Filter out weak detections
        if confidence > args["confidence"]:
            idx = int(detections[0, 0, i, 1])  # Get the class index

            # Ignore detections that are not people
            if CLASSES[idx] != "person":
                continue

            # Get the bounding box coordinates
            box = detections[0, 0, i, 3:7] * np.array([W, H, W, H])
            (startX, startY, endX, endY) = box.astype("int")
            start_point = (startX, startY)
            end_point = (endX, endY)
            color = (255, 0, 0)
            thickness = 2
            found = True  # Set found to True
            image = cv2.rectangle(image, start_point, end_point, color, thickness)  # Draw the rectangle
    return found, image  # Return if found and the image

# Parsing command line arguments
ap = argparse.ArgumentParser()
ap.add_argument("-u", "--url", required=True, help="#url for the video")
ap.add_argument("-c", "--confidence", type=float, default=0.4,
    help="#minimum probability to filter weak detections")
ap.add_argument("-s", "--skip-frames", type=int, default=10,
    help="# of skip frames between detections")
ap.add_argument("-v", "--view", required=False, default="false",
    help="# view video")
ap.add_argument("-t", "--threshold", required=False, default=4000,
    help="# motion detection threshold")
args = vars(ap.parse_args())  # Convert arguments to a dictionary

# Load pre-trained MobileNet SSD model
net = cv2.dnn.readNetFromCaffe("mobilenet_ssd/MobileNetSSD_deploy.prototxt", "mobilenet_ssd/MobileNetSSD_deploy.caffemodel")
W = None
H = None
totalFrames = 0
newImage = smallFrame = 0
image_sent = datetime.now()
image_sent -= timedelta(minutes=1)
vs = None
found = False
avg = None
outVideo = None

# Main loop
while True:
    notToSkip = totalFrames % args["skip_frames"] == 0  # Check if we need to process this frame
    vs = getFrame(args["url"], vs)  # Get a frame from the video stream
    if cv2.waitKey(10) & 0xFF == ord('q'):
        break
    rt, frame = vs.retrieve()  # Retrieve the frame
    if not rt:
        totalFrames = 0
        if outVideo:
            outVideo.release()
            outVideo = None
        vs = getFrame(args["url"], vs)
        continue
    if notToSkip:
        smallFrame = imutils.resize(frame, width=500)  # Resize the frame
        grey = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)  # Convert to grayscale
        grey = cv2.GaussianBlur(grey, (21, 21), 0)  # Blur the image

        if avg is None or totalFrames > 600:
            totalFrames = 0
            print("[INFO] starting background model...")
            avg = grey.copy().astype("float")  # Initialize background model
            continue

        cv2.accumulateWeighted(grey, avg, 0.5)  # Update background model
        frameDelta = cv2.absdiff(grey, cv2.convertScaleAbs(avg))  # Compute the absolute difference

        thresh = cv2.threshold(frameDelta, 5, 255,
            cv2.THRESH_BINARY)[1]  # Apply threshold
        thresh = cv2.dilate(thresh, None, iterations=2)  # Dilate the image
        (cnts, _) = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE)  # Find contours

        motion = False
        for c in cnts:
            if cv2.contourArea(c) < args['threshold']:
                continue

            (x, y, w, h) = cv2.boundingRect(c)
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)  # Draw the rectangle
            motion = True
            break

        if motion:
            print("people detection....")
            totalFrames = 0
            rgb = cv2.cvtColor(smallFrame, cv2.COLOR_BGR2RGB)  # Convert to RGB
            if W is None or H is None:
                (H, W) = smallFrame.shape[:2]
            found, newImage = getDetection(args, smallFrame)  # Get detections

    if found:
        cur = datetime.now()
        checkcur = cur - timedelta(minutes=1)
        if checkcur > image_sent:
            image_sent = cur
            send_alert()  # Send an alert
            width = int(vs.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(vs.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # Set video codec
            timestr = time.strftime("%Y%m%d-%H%M%S.mp4")
            timestr = "HumanDetectionRecord/" + timestr
            if not outVideo:
                outVideo = cv2.VideoWriter(timestr, fourcc, 15.0, (width, height))  # Initialize video writer

    if args["view"] != "false":
        cv2.imshow('frame', newImage)  # Show the frame with detections
        cv2.imshow('grey', grey)  # Show the grayscale image
    if outVideo:
        outVideo.write(frame)  # Write the frame to the video
        if not found and not motion:
            print("Stopping video")
            outVideo.release()  # Release the video writer
            outVideo = None
    totalFrames += 1  # Increment the frame count


iface = gr.Interface(
    fn=getDetection(),                # Function to be called (no processing in this case)
    inputs=gr.Image(),               # Input type
    outputs=gr.Image(),              # Output type
    title="Simple Gradio App",       # Title of the app
    description="Upload an image and see it displayed without any processing."  # Description
)

iface.launch()