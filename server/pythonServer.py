import gi
gi.require_version('Gst', '1.0')
gi.require_version('GstRtspServer', '1.0')
from gi.repository import Gst, GstRtspServer, GLib
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import threading

class MyFactory(GstRtspServer.RTSPMediaFactory):
    def __init__(self, **properties):
        super(MyFactory, self).__init__(**properties)
        self.set_shared(True)
        self.pipeline_str = ""

    def do_create_element(self, url):
        print(f"Creating pipeline with: {self.pipeline_str}")
        try:
            pipeline = Gst.parse_launch(self.pipeline_str)
            return pipeline
        except Exception as e:
            print(f"Error creating pipeline: {e}")
            return None

class MyServer(GstRtspServer.RTSPServer):
    def __init__(self, **properties):
        super(MyServer, self).__init__(**properties)
        self.factory = MyFactory()
        self.get_mount_points().add_factory("/stream", self.factory)
        self.set_service("8554")
        self.attach(None)

class RequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/switch-stream':
            self.handle_switch_stream()
        elif self.path == '/share-recording':
            self.handle_share_recording()
        elif self.path == '/multiple-streams':
            self.handle_multiple_streams()
        elif self.path == '/multiple-recordings':
            self.handle_multiple_recordings()
        else:
            self.handle_404()

    def handle_switch_stream(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)

        channel = data.get('channel')

        print(f"Received switch_stream request for channel: {channel}")

        if channel is not None:
            hls_url = f"http://127.0.0.1:8083/stream/demoStream/channel/{channel}/hls/live/index.m3u8"
            my_server.factory.pipeline_str = (
                f"souphttpsrc location={hls_url} ! "
                "hlsdemux ! "
                "decodebin ! "
                "videoconvert ! "
                "videoscale ! video/x-raw,width=640,height=360 ! "
                "x264enc bitrate=256 speed-preset=ultrafast tune=zerolatency ! "
                "rtph264pay name=pay0 pt=96"
            )
            print(f"Set pipeline_str to: {my_server.factory.pipeline_str}")
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"message": "Stream switched"}).encode('utf-8'))
        else:
            print("Channel number is missing in the request.")
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"message": "Channel number is required"}).encode('utf-8'))

    def handle_share_recording(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        videoUrl = data.get('videoUrl')

        print(f"Received share recording request for channel: {videoUrl}")

        if videoUrl is not None:
            my_server.factory.pipeline_str = (
                f"souphttpsrc location={videoUrl} ! "
                "decodebin ! "
                "videoconvert ! "
                "videoscale ! video/x-raw,width=640,height=360 ! "
                "x264enc bitrate=256 speed-preset=ultrafast tune=zerolatency ! "
                "rtph264pay name=pay0 pt=96"
            )
            print(f"Set pipeline_str to: {my_server.factory.pipeline_str}")
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"message": "Recording shared"}).encode('utf-8'))
        else:
            print("Video URL is missing in the request.")
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"message": "Video URL is required"}).encode('utf-8'))

    def handle_multiple_recordings(self):
      content_length = int(self.headers['Content-Length'])
      post_data = self.rfile.read(content_length)
      data = json.loads(post_data)
      recording_keys = data.get('recording_keys', [])

      if recording_keys:
        try:
            recording_urls = [f"https://d1gx8w5c0cotxv.cloudfront.net/{key}" for key in recording_keys]

            soup_sources = " ".join(
                f"uridecodebin uri={url} name=src_{i} ! queue ! videoconvert ! video/x-raw,format=RGBA ! queue ! comp.sink_{i} "
                for i, url in enumerate(recording_urls)
            )

            sink_positions = " ".join(
                f"sink_{i}::xpos={(i % 2) * 640} sink_{i}::ypos={(i // 2) * 360} sink_{i}::width=640 sink_{i}::height=360 sink_{i}::zorder={i} "
                for i in range(len(recording_urls))
            )

            pipeline_str = (
                f"{soup_sources} compositor name=comp {sink_positions} ! "
                "video/x-raw,format=RGBA,width=1280,height=720 ! "
                "videoconvert ! x264enc bitrate=512 speed-preset=ultrafast tune=zerolatency ! "
                "rtph264pay name=pay0 pt=96"
            )

            my_server.factory.pipeline_str = pipeline_str
            print(f"Set pipeline_str for multiple recordings to: {my_server.factory.pipeline_str}")

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"message": "Multiple recordings combined"}).encode('utf-8'))

        except Exception as e:
            print(f"Error creating multiple recordings pipeline: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"message": "Error processing recordings"}).encode('utf-8'))
      else:
        print("No recording keys provided in the request.")
        self.send_response(400)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"message": "Recording keys are required"}).encode('utf-8'))

    def handle_multiple_recordings(self):
      content_length = int(self.headers['Content-Length'])
      post_data = self.rfile.read(content_length)
      data = json.loads(post_data)
      recording_key = data.get('recording_key', [])

      if recording_key:
        recording_urls = [f"https://d1gx8w5c0cotxv.cloudfront.net/{key}" for key in recording_key]

        soup_sources = " ".join(
            f"souphttpsrc location={url} is-live=false do-timestamp=true ! queue ! decodebin ! videoconvert ! video/x-raw,format=RGBA ! queue ! comp.sink_{i} "
            for i, url in enumerate(recording_urls)
        )

        sink_positions = " ".join(
            f"sink_{i}::xpos={(i % 2) * 640} sink_{i}::ypos={(i // 2) * 360} sink_{i}::width=640 sink_{i}::height=360 sink_{i}::zorder={i} "
            for i in range(len(recording_urls))
        )

        pipeline_str = (
            f"{soup_sources} compositor name=comp {sink_positions} ! "
            "video/x-raw,format=RGBA,width=1280,height=720 ! "
            "videoconvert ! x264enc bitrate=512 speed-preset=ultrafast tune=zerolatency ! "
            "rtph264pay name=pay0 pt=96"
        )

        my_server.factory.pipeline_str = pipeline_str
        print(f"Set pipeline_str for multiple recordings to: {my_server.factory.pipeline_str}")

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"message": "Multiple recordings combined"}).encode('utf-8'))
      else:
          print("No recording keys provided in the request.")
          self.send_response(400)
          self.send_header('Content-type', 'application/json')
          self.end_headers()
          self.wfile.write(json.dumps({"message": "Recording keys are required"}).encode('utf-8'))

    def handle_404(self):
        self.send_response(404)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"message": "Endpoint not found"}).encode('utf-8'))

if __name__ == '__main__':
    Gst.init(None)

    my_server = MyServer()
    my_server.set_service("8554")
    print(f"RTSP server is running at rtsp://23.23.65.133:8554/stream")

    http_server = HTTPServer(('0.0.0.0', 8084), RequestHandler)
    print("HTTP server is running at http://0.0.0.0:8084")
    http_server_thread = threading.Thread(target=http_server.serve_forever)
    http_server_thread.start()

    try:
        loop = GLib.MainLoop()
        loop.run()
    except KeyboardInterrupt:
        pass
    finally:
        http_server.shutdown()
        http_server_thread.join()
        loop.quit()
