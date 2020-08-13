#!/usr/bin/env node
import { main } from '@appsemble/cli';

if (require.main === module) {
  main(process.argv.slice(2));
}
