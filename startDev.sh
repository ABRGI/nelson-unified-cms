#!/bin/bash

declare -a dirs=("AI-api" "../lambda" "../ui-editor-layer")

export $(cat ".env" | xargs)

for dir in "${dirs[@]}"
do
    echo "Starting application in $dir"
    cd "$PWD/$dir"
    name=$(basename $dir)
    pm2 start npm --name $name -- run dev --watch
    sleep 5
done