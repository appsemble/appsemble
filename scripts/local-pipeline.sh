#!/bin/bash

(
  set -e

  # setup
  npm ci
  export DATABASE_URL='postgres://admin:password@localhost:5433/appsemble'
  docker compose --project-name pipeline --file docker-compose-pipeline.yaml up -d

  # cspell
  npx -- cspell

  # eslint
  npx -- eslint --format gitlab .

  # helm lint
  docker exec helm sh -c 'helm lint charts/*'

  # i18n
  npm run appsemble -- app extract-messages --verify nl apps/*

  # prettier
  npx -- prettier .

  # remark lint
  npx -- remark --frail --no-stdout .

  # stylelint
  npx -- stylelint .

  # tsc
  npx --workspaces tsc

  # validate
  npm run scripts -- validate

  # test node
  npm test -- --coverage --shard=1/3 --watch false
  npm test -- --coverage --shard=2/3 --watch false
  npm test -- --coverage --shard=3/3 --watch false
)

# cleanup
docker compose --project-name pipeline --file docker-compose-pipeline.yaml down --volumes
