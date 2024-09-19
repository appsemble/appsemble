#!/usr/bin/env sh
set -e
apt-get update && apt-get install -y socat

npm install
npx -- playwright install

socat TCP-LISTEN:9999,fork TCP:appsemble:9999 &  # forward localhost:9999 to appsemble:9999

npm --workspace @appsemble/e2e run e2e -- --max-failures 6

kill "$(jobs -p)" 2>/dev/null || true # terminate port forwarding
