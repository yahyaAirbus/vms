FROM busybox:1.35.0-uclibc

COPY config.json /config/config.json

COPY init.sh /init.sh
RUN chmod +x /init.sh

ENTRYPOINT ["/init.sh"]
