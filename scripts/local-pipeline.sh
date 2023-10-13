#!/bin/bash

(
  set -e

  # setup
  yarn install
  export DATABASE_URL='postgres://admin:password@localhost:5433/appsemble'
  docker compose --project-name pipeline --file docker-compose-pipeline.yaml up -d

  # cspell
  yarn cspell

  # eslint
  yarn eslint --format gitlab .

  # helm lint
  docker exec helm sh -c 'helm lint charts/*'

  # i18n
  yarn appsemble app extract-messages --verify nl apps/*

  # prettier
  yarn prettier .

  # remark lint
  yarn remark --frail --no-stdout .

  # stylelint
  yarn stylelint .

  # tsc
  yarn workspaces run tsc

  # validate
  yarn scripts validate

  # test node
  yarn test --coverage --shard=1/3 --watch false
  yarn test --coverage --shard=2/3 --watch false
  yarn test --coverage --shard=3/3 --watch false
)

# cleanup
docker compose --project-name pipeline --file docker-compose-pipeline.yaml down --volumes
