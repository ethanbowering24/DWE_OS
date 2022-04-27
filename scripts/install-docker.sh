#!/bin/bash

REPO=https://raw.githubusercontent.com/DeepwaterExploration/exploreHD_Controls/main

set -e

echo "Installing docker if not already installed"
docker --version || curl -fsSL https://get.docker.com/ | sh

systemctl enable docker

# Pull docker image
echo "Pulling docker image"
docker pull brandondwe/dwe-controls

# Create docker image
echo "Creating docker image"
if [ "$(docker ps -q -f name=dwe-controls)" ]; then
    docker rm dwe-controls --force
fi
docker create \
    --name dwe-controls \
    --net=host \
    -v /dev:/dev -v /dwe/.dwe:/root/.dwe -v /run/udev:/run/udev \
    --privileged brandondwe/dwe-controls

echo "Installing service"
rm /usr/lib/systemd/system/dwe-controls.service
curl $REPO/docker/dwe-controls.service -o /usr/lib/systemd/system/dwe-controls.service

systemctl daemon-reload
systemctl enable dwe-controls
systemctl start dwe-controls
