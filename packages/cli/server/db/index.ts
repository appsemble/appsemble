import { Config, JsonDB } from 'node-json-db';

const config = new Config('packages/cli/data.json', true, true, '/');

export const db = new JsonDB(config);
