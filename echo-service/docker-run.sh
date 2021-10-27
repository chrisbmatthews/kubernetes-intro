#!/bin/bash

docker rm -f echo-service

docker run -it -p 8080:8080 --name echo-service nexus.cbmatthews.com:8082/echo-service:latest