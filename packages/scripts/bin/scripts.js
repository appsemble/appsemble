#!/usr/bin/env node
const path = require('path');

// eslint-disable-next-line import/no-unresolved
require('ts-node').register({ dir: path.dirname(__dirname) });

require('../src').default();
