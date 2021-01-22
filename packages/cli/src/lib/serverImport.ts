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
 * @param members - The names of the exported member to import.
 * @returns The exported member.
 */
export async function serverImport<
  T extends 'migrate' | 'start' | 'cleanupResources' | 'runCronJobs' | 'setArgv'
>(...members: T[]): Promise<Record<T, any>> {
  try {
    const mod = await import('@appsemble/server');
    members.forEach((member) => {
      if (!Object.hasOwnProperty.call(mod, member)) {
        throw new Error(`@appsemble/server does not export ${member}`);
      }
    });
    return mod;
  } catch (error: unknown) {
    if (
      (error as any).code !== 'MODULE_NOT_FOUND' ||
      (error as any).requireStack?.[0] !== __filename
    ) {
      throw error;
    }
    throw new AppsembleError(INSTALL_MESSAGE);
  }
}
