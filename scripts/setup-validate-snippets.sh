#!/usr/bin/env sh
set -e

npm ci

npm run appsemble -- config set remote "$APPSEMBLE_REMOTE"

. scripts/seed-account.sh

npm run appsemble -- organization create appsemble \
  --description "The open source low-code app building platform" \
  --email support@appsemble.com \
  --icon packages/server/assets/appsemble.png \
  --name Appsemble \
  --website https://appsemble.com

npm run appsemble -- block publish 'blocks/*'
