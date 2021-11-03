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
sudo snap install microk8s --classic --channel=1.21
sudo usermod -a -G microk8s <yourusername>
sudo chown -f -R <yourusername> ~/.kube
newgrp microk8s
alias kubectl="microk8s kubectl"
microk8s start
```

Don't forget - to stop microk8s, you can run
```
microk8s stop
```

For more info see:
https://microk8s.io/docs

#### Adding microk8s to your standard kubectl
If you want to use your locally installed version of `kubectl` (rather than aliasing kubectl to `microk8s kubectl` as shown above), you will need to add the microk8s configuration to your `~/.kube/config` file.

If you don't already have a `~/.kube/config` file, all you need to do is:

```
mkdir ~/.kube
microk8s config > ~/.kube/config
```

However, if you already have a config file and want to merge in the new microk8s config, you can do this to create a combined config file:

```
microk8s config > ~/.kube/config-microk8s

cp ~/.kube/config ~/.kube/config.old

KUBECONFIG=~/.kube/config:~/.kube/config-microk8s kubectl config view --merge --flatten > ~/.kube/newconfig

cp ~/.kube/newconfig ~/.kube/config
```

For more info see:
https://microk8s.io/docs/working-with-kubectl

## kubectx and kubens
If you have more than one k8s config, it will be convenient if you install `kubectx` and `kubens` from here:

https://github.com/ahmetb/kubectx

The easiest way to install these is to clone that repo, then add the cloned directory to your `$PATH`.

This works with Linux, macOS and even Windows (via WSL or if you have Git Bash installed).

## The example service
This repo contains a sample service called `echo-service`.  This is a nodejs application that exposes a REST endpoint:

http://localhost:8080/echo/something

It'll return a response like this:

```
{
  "echo": {
    "0": "something"
  },
  "hostname": "your-hostname"
}
```

To run it locally:

```
cd echo-service
npm install
npm start
```

This will start the service on port 8080.

To call the service:

```
curl -v localhost:8080/echo/abc
```


### Docker image creation
You can also package the `echo-service` as a docker image (you'll need to do this if you want to deploy it to k8s):

```
./image-build.sh
```

...and you can run it directly on docker using:

```
./docker.run.sh
```

To call the service:

```
curl -v localhost:8080/echo/abc
```

But we are mainly interested in deploying it to k8s :)

#### Export to microk8s
If you are running microk8s, the docker image needs to get into microk8s's local container registry.  To do this, after building the docker image, you can export it to a tar and import it into the microk8s registry like so:

```
docker save echo-service:LATEST > echo-service.tar
microk8s ctr image import echo-service.tar
```

You can also uncomment these lines in the image-build.sh script :)

If you are running k8s thru Docker Desktop, no need to do this.

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

To call the service:

```
curl -v localhost:30080/echo/abc
```

### Some handy kubectl commands
Here are some of the commands I use most often:

```
kubectl get all                 Lists all k8s objects in the current namespace

kubectl describe something      Gives an in-depth description of the k8s object you are interested in

kubectl logs -f pod/podname     Follow the logs for a specific pod

kubectl apply -f some.yaml      Deploys the contents of a yaml file idempotently

kubectl delete -f some.yaml     Undeploys the contents of a yaml file

kubectl exec --stdin --tty pod/podname -- sh    Get into a running container
```

## Understanding k8s concepts
The simplest deployment unit on k8s is the Pod.  You can think of a Pod as being sort of synonymous with a docker container.

I rarely deploy Pods directly.  I typically deploy them via a higher-level wrapper called the `Deployment`.

### Deployment
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
        image: echo-service:LATEST
        ports:
        - containerPort: 8080
```

Items of note:

`spec.replicas`: The number of Pod replicas to deploy

`spec.selector.matchLabels` and `spec.template.metadata.labels`: These two sections need to match.  These labels can be used to locate the Pod with a Selector (usually via a `Service`, as described below)

`spec.template.spec.containers.image`: The docker image we'll be deploying

Pretty verbose - don't you just love yaml :)

### Service
We can't route to the Pod from outside the cluster by default.  A `Service` allows us to route in from outside, especially if we use a `NodePort` service (which opens up a port on the host).

Here is an example of a `Service`:

```
apiVersion: v1
kind: Service
metadata:
  name: echo-service
spec:
  type: NodePort
  selector:
    app: echo-service
  ports:
    - port: 8080
      targetPort: 8080
      # Optional field
      # By default and for convenience, the Kubernetes control plane will allocate a port from a range (default: 30000-32767)
      nodePort: 30080
```

Notice `spec.selector`.  This is used to find the correct `Pod` to route to.  Also the example `Deployment`'s section: ``spec.selector.matchLabels``

The Service will go and find all Pods that match the `selector` criteria.  It'll then route the traffic to one of the Pods it found.

You can think of this as a rudimentary load balancer, since the Service *will* route to different Pods on subsequent calls.

#### Ports and Routing
This Service runs inside the cluster as `echo-service:8080` (defined by its `port`).  

It routes to a Pod that matches the `selector`.  

In our case, it finds a Pod called `echo-service` and routes to that Pod at `8080` as well (the `targetPort`).

And finally, we open this Service up to the outside world on port `30080`.

You can think of the routing this way:

```
client -> k8scluster:30080 -> Service echo-service:8080 -> Pod echo-service:8080
```

### ConfigMap
You likely want to include external configuration with your deployed Pod.

I most often want a `properties` file somewhere on the Pod's filesystem.

A simple way to do this is with a `ConfigMap`.  Here is an example:

```
apiVersion: v1
kind: ConfigMap
metadata:
  name: service-config
data:
  env.properties: |
    MY_MESSAGE="hello from my ConfigMap!"
  another.properties: |
    ANOTHER_MESSAGE="more stuff if you need it"
```

In the above example, my `ConfigMap` contains 2 properties files: `env.properties` and `another.properties`.

How can I mount those 2 files into my running Pod?

We modify the `template.spec` section of the `Deployment` to include this:

```
spec:
    containers:
    - name: echo-service
    image: echo-service:LATEST
    ports:
    - containerPort: 8080

    volumeMounts:
    - name: config-volume
        mountPath: /run/config/

    volumes:
    - name: config-volume
    configMap:
          name: service-config
```

The `volumeMounts` section tells us we want to mount something at `/run/config` inside the Pod.

We then define the `config-volume` in the `volumes` section.  In this case, it references the `configMap` named `service-config`.

When this is applied, you will find these files inside the Pod:

```
/run/config/env.properties
/run/config/another.properties
```