import { Config, JsonDB } from 'node-json-db';

const config = new Config('data.json', true, true, '/');

export const db = new JsonDB(config);
