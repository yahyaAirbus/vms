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
        self.get_mount_points().add_factory("/test", self.factory)
        self.set_service("8554")
        self.attach(None)

class RequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/switch_stream':
            self.handle_switch_stream()
        elif self.path == '/share-recording':
            self.handle_share_recording()
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
                "x264enc bitrate=512 ! "
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
        print(f"Received switch_stream request for channel: {videoUrl}")

        if videoUrl is not None:
            my_server.factory.pipeline_str = (
                f"souphttpsrc location= {videoUrl} ! "
                "decodebin ! "
                "videoconvert ! "
                "x264enc bitrate=512 ! "
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

    def handle_404(self):
        self.send_response(404)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"message": "Endpoint not found"}).encode('utf-8'))

if __name__ == '__main__':
    Gst.init(None)

    my_server = MyServer()
    my_server.set_service("5554")
    print("RTSP server is running at rtsp://localhost:5554/test")

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





