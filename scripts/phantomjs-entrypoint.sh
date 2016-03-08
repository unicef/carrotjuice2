#!/bin/bash
PORT=8080 node server.js &
while ! curl -s http://localhost:8080/test.html > /dev/null; do
  echo "Frontend server not yet accessible ..." >&2
  sleep 1;
done
./node_modules/mocha-phantomjs/bin/mocha-phantomjs -p /usr/bin/phantomjs http://localhost:8080/test.html
