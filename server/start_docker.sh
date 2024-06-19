cd rtsp_server
docker run --rm -e RTSP_PROTOCOLS=tcp -p 8554:8554 rtsp-simple-server