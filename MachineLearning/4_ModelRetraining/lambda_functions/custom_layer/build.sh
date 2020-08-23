#!/bin/bash -x

set -e

docker run -v "$PWD":/var/task "lambci/lambda:build-python3.8" /bin/sh -c "pip install -r requirements.txt -t python/lib/python3.8/site-packages/; exit"

zip -r pythonlayer.zip python > /dev/null