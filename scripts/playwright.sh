#!/usr/bin/env sh
set -e

npm install

npx -- playwright install

npm --workspace @appsemble/e2e run e2e -- --max-failures 6
