#!/usr/bin/env node
const path = require('path');

require('ts-node').register({ dir: path.dirname(__dirname) });

require('../src').default();
