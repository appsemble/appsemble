#!/usr/bin/env sh

npm install
npx -- playwright install
npm --workspace @appsemble/e2e run e2e -- --max-failures 6
