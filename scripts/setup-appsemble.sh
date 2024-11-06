#!/usr/bin/env sh
set -e

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
npm run appsemble -- app publish 'apps/*' --resources --assets --assets-clonable
