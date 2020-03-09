import { AppsembleError } from '@appsemble/node-utils';

const PROMPT = process.platform === 'win32' ? '>' : '$';
const COMMAND = /yarn/.test(process.env.npm_execpath)
  ? 'yarn add --dev --ignore-workspace-root-check'
  : 'npm install --save-dev';
const INSTALL_MESSAGE = `This command requires the Appsemble server to be installed. It can be installed by running the following command:

${PROMPT} ${COMMAND} @appsemble/server
`;

/**
 * Import an exported member of @appsemble/server.
 *
 * @param {string} member The name of the exported member to import.
 * @returns The exported member.
 */
export default async function serverImport(member) {
  try {
    const mod = await import('@appsemble/server');
    if (!Object.prototype.hasOwnProperty.call(mod, member)) {
      throw new Error(`@appsemble/server does not export ${member}`);
    }
    return mod[member];
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND' || error.requireStack[0] !== __filename) {
      throw error;
    }
    throw new AppsembleError(INSTALL_MESSAGE);
  }
}
