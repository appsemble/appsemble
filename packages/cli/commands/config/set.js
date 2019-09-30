import { logger } from '@appsemble/node-utils';
import fs from 'fs-extra';
import readPkgUp from 'read-pkg-up';
import { inspect } from 'util';

export const command = 'set <key> <value>';
export const description = 'Set an Appsemble configuration option in package.json.';

export function builder(yargs) {
  return yargs
    .positional('key', {
      describe: 'The key whose value to set',
    })
    .positional('value', {
      describe: 'The value to set',
    });
}

export async function handler({ key, value }) {
  const { path, packageJson } = await readPkgUp({ normalize: false });
  if (!Object.prototype.hasOwnProperty.call(packageJson, 'appsembleServer')) {
    packageJson.appsembleServer = {};
  }
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch (err) {
    parsed = value;
  }
  packageJson.appsembleServer[key] = parsed;
  await fs.writeJson(path, packageJson, { spaces: 2 });
  logger.info(
    `Set option appsembleServer.${key} to ${inspect(parsed, { colors: true })} in ${path}`,
  );
}
