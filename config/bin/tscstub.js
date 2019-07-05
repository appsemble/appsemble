#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const pkg = path.join(cwd, 'package.json');

if (fs.existsSync(path.join(cwd, 'tsconfig.json'))) {
  // eslint-disable-next-line no-console
  console.error(`Remove the tsc stub script from ${pkg}`);
  process.exit(1);
} else {
  // eslint-disable-next-line no-console
  console.log(`This is a tsc stub for ${pkg}`);
}
