yarn appsemble organization create appsemble \
  --description "The open source low-code app building platform" \
  --email support@appsemble.com \
  --icon packages/server/assets/appsemble.png \
  --name Appsemble \
  --website https://appsemble.com

yarn appsemble block create --organization appsemble --template vanilla --name template-vanilla --path blocks
yarn appsemble block create --organization appsemble --template preact --name template-preact --path blocks
yarn appsemble block create --organization appsemble --template mini-jsx --name template-mini-jsx --path blocks

yarn appsemble -vv block publish blocks/*
yarn appsemble -vv app publish apps/* --resources --modify-context
yarn appsemble -vv asset publish --app apps/soundboard apps/soundboard/assets/*
