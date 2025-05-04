#!/usr/bin/env sh
set -e

npm ci

npm run appsemble -- config set context e2e
npm run appsemble -- config set remote "$APPSEMBLE_REMOTE"

. scripts/seed-account.sh

npm run appsemble -- organization create appsemble \
  --description "The open source low-code app building platform" \
  --email support@appsemble.com \
  --icon packages/server/assets/appsemble.png \
  --name Appsemble \
  --website https://appsemble.com

npm run appsemble -- block publish 'blocks/*'

npm run appsemble -- app publish 'apps/empty'
npm run appsemble -- app publish 'apps/holidays'
npm run appsemble -- app publish 'apps/notes'
npm run appsemble -- app publish 'apps/person'
npm run appsemble -- app publish 'apps/survey'
npm run appsemble -- app publish 'apps/unlittered'
