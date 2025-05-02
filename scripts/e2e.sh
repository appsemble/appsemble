#!/usr/bin/env sh

docker exec -i seeder sh -c 'scripts/setup-e2e.sh'
docker exec -i playwright sh -c 'scripts/playwright.sh'
