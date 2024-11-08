#!/usr/bin/env sh
set -e

npm install

# Transpile to JS so the playwright tests can use our packages
npm --workspace @appsemble/types run prepack
npm --workspace @appsemble/utils run prepack

npx -- playwright install

npm --workspace @appsemble/e2e run e2e -- --max-failures 6
