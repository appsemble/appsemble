#!/usr/bin/env sh

npm ci

. scripts/seed-account.sh

npm run appsemble -- config set context e2e
npm run appsemble -- config set remote "$APPSEMBLE_REMOTE"

. scripts/setup-appsemble.sh

# Transpile to JS so the playwright tests can use our packages
npm --workspace @appsemble/types run prepack
npm --workspace @appsemble/utils run prepack
npm --workspace @appsemble/node-utils run prepack
