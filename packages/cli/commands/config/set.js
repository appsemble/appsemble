import fs from 'fs-extra';
import readPkgUp from 'read-pkg-up';
import logging from 'winston';

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
  const { path, pkg } = await readPkgUp({ normalize: false });
  if (!Object.prototype.hasOwnProperty.call(pkg, 'appsembleServer')) {
    pkg.appsembleServer = {};
  }
  pkg.appsembleServer[key] = value;
  await fs.writeJson(path, pkg, { spaces: 2 });
  logging.info(`Set option "appsembleServer.${key}" to "${value}" in ${path}`);
}
