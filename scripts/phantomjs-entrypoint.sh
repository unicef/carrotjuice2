#!/bin/bash
PORT=8080 node server.js &
sleep 5
./node_modules/mocha-phantomjs/bin/mocha-phantomjs http://localhost:8080/test.html
