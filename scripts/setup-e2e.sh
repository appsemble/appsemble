npm ci

. scripts/seed-account.sh

npm run appsemble -- config set context e2e
npm run appsemble -- config set remote "$APPSEMBLE_REMOTE"

. scripts/setup-appsemble.sh
