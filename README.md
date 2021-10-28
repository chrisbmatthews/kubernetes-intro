# Kubernetes Tutorial
See DevbaseMedia here: http://devbasemedia.com

This tutorial assumes you know something about docker.  To get a quick intro to docker, see my video here:

https://www.youtube.com/watch?v=yJjGe5om4Lo

This repo is meant to introduce you to some basic kubernetes concepts.

## Installing k8s
### Windows or macOS
If you are runing Docker Desktop on Windows or macOS:
- Open the Docker Desktop preferences
- Go to the Kubernetes tab
- Select 'Enable Kubernetes'
- Click 'Apply & Restart'

### Linux
You have several options.  An easy one is to install microk8s.  I tested this on Ubuntu 20.04:

```
sudo snap install kubectl
sudo snap install microk8s --classic --channel=1.21
microk8s start
mkdir ~/.kube
microk8s config > ~/.kube/config
```

Don't forget - to stop microk8s, you can run
```
microk8s stop
```

For more info see:
https://microk8s.io/docs

## The example service
This repo contains a sample service called `echo-service`.  This is a nodejs application that exposes a REST endpoint:

http://localhost:8080/echo/something

It'll return a response like this:

```
{
  "echo": {
    "0": "something"
  },
  "hostname": "0e1f88a1f6ac"
}
```

To run it locally:

```
cd echo-service
npm install
npm start
```

This will start the service on port 8080.

### Docker image creation
You can also package the `echo-service` as a docker image (you'll need to do this if you want to deploy it to k8s):

```
./image-build.sh
```

...and you can run it directly on docker using:

```
./docker.run.sh
```

But we are mainly interested in deploying it to k8s :)

## Kubernetes deploy
To deploy the `echo-service` to kubernetes, run:

```
./image-build.sh
./deploy-k8s.sh
```

The `deploy-k8s.sh` script is actually running:

```
kubectl apply -f k8s/echo-service.yaml
```

Deployment is actually described by that `echo-service.yaml` file.

You can also undeploy by running:

```
./undeploy-k8s.sh
```

### Some handy kubectl commands
Here are some of the commands I use most often:

```
kubectl get all                 Lists all k8s objects in the current namespace

kubectl describe something      Gives an in-depth description of the k8s object you are interested in

kubectl logs -f pod/podname     Follow the logs for a specific pod

kubectl apply -f some.yaml      Deploys the contents of a yaml file idempotently

kubectl delete -f some.yaml     Undeploys the contents of a yaml file
```

## Understanding k8s concepts
The simplest deployment unit on k8s is the Pod.  You can think of a Pod as being sort of synonymous with a docker container.

I rarely deploy Pods directly.  I typically deploy them via a higher-level wrapper called the `Deployment`.

You can see a sample `Deployment` in the `k8s/echo-service.yaml` file:

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: echo-service-deployment
  labels:
    app: echo-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: echo-service
  template:
    metadata:
      labels:
        app: echo-service
    spec:
      containers:
      - name: echo-service
        image: echo-service:latest
        ports:
        - containerPort: 8080
```