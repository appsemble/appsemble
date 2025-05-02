#!/usr/bin/env sh

docker exec -i seeder sh -c 'scripts/setup-validate-snippets.sh'
docker exec -i seeder sh -c 'npm run scripts -- validate-docs --organization appsemble --remote "$APPSEMBLE_REMOTE" -vv'
