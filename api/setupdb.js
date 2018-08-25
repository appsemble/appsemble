#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

import yaml from 'js-yaml';

import { getPool } from './utils/db';
import jsonSchemaToTable from './utils/jsonSchemaToTable';


const dirname = path.dirname(new URL(import.meta.url).pathname);


async function main() {
  const names = [
    'App',
  ];
  const queries = names.map((name) => {
    const fullPath = path.join(dirname, 'api', 'definitions', `${name}.yaml`);
    const schema = yaml.safeLoad(fs.readFileSync(fullPath))[name];
    return [jsonSchemaToTable(schema, name)];
  });
  const pool = getPool();
  await queries.reduce(async (acc, [query, values = []]) => {
    await acc;
    await pool.query(query, values);
  }, null);
  await pool.end();
}


main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
