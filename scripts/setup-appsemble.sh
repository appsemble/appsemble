#!/usr/bin/env sh
set -e
apt-get update && apt-get install -y socat

socat TCP-LISTEN:9999,fork TCP:appsemble:9999 &  # forward localhost:9999 to appsemble:9999

npm run appsemble -- organization create appsemble \
  --description "The open source low-code app building platform" \
  --email support@appsemble.com \
  --icon packages/server/assets/appsemble.png \
  --name Appsemble \
  --website https://appsemble.com

npm run appsemble -- block create --organization appsemble --template vanilla --name template-vanilla --path blocks
npm run appsemble -- block create --organization appsemble --template preact --name template-preact --path blocks
npm run appsemble -- block create --organization appsemble --template mini-jsx --name template-mini-jsx --path blocks

npm run appsemble -- block publish 'blocks/*'
npm run appsemble -- app publish 'apps/*' --resources --assets --assets-clonable --modify-context

kill "$(jobs -p)" 2>/dev/null || true # terminate port forwarding
