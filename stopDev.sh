#!/bin/bash

declare -a dirs=("AI-api" "lambda" "ui-editor-layer")

for dir in "${dirs[@]}"
do
    name=$(basename $dir)
    pm2 stop $name
    pm2 delete $name
done