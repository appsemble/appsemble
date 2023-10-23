yarn install

. scripts/seed-account.sh

yarn appsemble config set context e2e
yarn appsemble config set remote $APPSEMBLE_REMOTE

. scripts/setup-appsemble.sh
