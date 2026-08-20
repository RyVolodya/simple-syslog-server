#!/bin/sh
set -eu

envsubst '${PG_HOST} ${PG_PORT} ${PG_DATABASE} ${PG_USER} ${PG_PASSWORD}' \
  < /etc/rsyslog.conf.template > /etc/rsyslog.conf

exec rsyslogd -n -f /etc/rsyslog.conf
