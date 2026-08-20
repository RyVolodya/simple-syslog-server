FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends rsyslog rsyslog-pgsql gettext-base ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY rsyslog.conf.template /etc/rsyslog.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 514/udp 514/tcp
ENTRYPOINT ["/entrypoint.sh"]
