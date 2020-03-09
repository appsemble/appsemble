import readPkgUp from 'read-pkg-up';

export const command = 'get <key>';
export const description = 'Get an Appsemble configuration option from package.json.';

export function builder(yargs) {
  return yargs.positional('key', {
    describe: 'The key whose value to get',
  });
}

export async function handler({ key }) {
  const { packageJson } = await readPkgUp({ normalize: false });
  if (Object.prototype.hasOwnProperty.call(packageJson, 'appsembleServer')) {
    // eslint-disable-next-line no-console
    console.log(packageJson.appsembleServer[key]);
  }
}
