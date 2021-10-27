#!/bin/sh

if [ -f "/run/config/env.properties" ]; then
    echo "env.properties found!"
    set -a
    source /run/config/env.properties
else
    echo "env.properties not found on startup"
fi

echo "About to start via npm..."
npm start