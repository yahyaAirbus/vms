import gi

gi.require_version('Gst', '1.0')
gi.require_version('GstRtspServer', '1.0')
from gi.repository import Gst, GstRtspServer, GLib

class MyFactory(GstRtspServer.RTSPMediaFactory):
    def __init__(self, **properties):
        super(MyFactory, self).__init__(**properties)
        self.set_shared(True)

    def do_create_element(self, url):
        pipeline_str = (
            "souphttpsrc location=http://127.0.0.1:8083/stream/demoStream/channel/1/hls/live/index.m3u8 ! "
            "hlsdemux ! "
            "decodebin ! "
            "videoconvert ! "
            "x264enc bitrate=512 ! "
            "rtph264pay name=pay0 pt=96"
        )
        print(f"Pipeline: {pipeline_str}")
        try:
            pipeline = Gst.parse_launch(pipeline_str)
            return pipeline
        except Exception as e:
            print(f"Error creating pipeline: {e}")
            return None

class MyServer(GstRtspServer.RTSPServer):
    def __init__(self, **properties):
        super(MyServer, self).__init__(**properties)
        self.factory = MyFactory()
        self.get_mount_points().add_factory("/test", self.factory)
        self.attach(None)

if __name__ == '__main__':
    Gst.init(None)
    server = MyServer()
    server.set_service("8554")  # Set the service port
    print("RTSP server is running at rtsp://localhost:8554/test")
    
    loop = GLib.MainLoop()
    loop.run()
