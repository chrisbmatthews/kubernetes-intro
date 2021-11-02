#!/bin/bash

docker build -t echo-service:LATEST .

#If you are running microk8s, you may want to do the following...
#This will import the docker image into the microk8s registry...

#docker save echo-service:LATEST > echo-service.tar
#microk8s ctr image import echo-service.tar