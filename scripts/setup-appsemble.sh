#!/usr/bin/env sh

npm run appsemble -- organization create appsemble \
  --description "The open source low-code app building platform" \
  --email support@appsemble.com \
  --icon packages/server/assets/appsemble.png \
  --name Appsemble \
  --website https://appsemble.com

npm run appsemble -- block create --organization appsemble --template vanilla --name template-vanilla --path blocks
npm run appsemble -- block create --organization appsemble --template preact --name template-preact --path blocks
npm run appsemble -- block create --organization appsemble --template mini-jsx --name template-mini-jsx --path blocks

npm run appsemble -- -vv block publish 'blocks/*'
npm run appsemble -- -vv app publish 'apps/*' --resources --modify-context
npm run appsemble -- -vv asset publish --app apps/soundboard 'apps/soundboard/assets/*'
