import { authenticate, logger } from '@appsemble/node-utils';
import { type AppLock, type AppVisibility } from '@appsemble/types';
import { type Argv } from 'yargs';

import { patchApp } from '../../lib/app.js';
import { type BaseArguments } from '../../types.js';

interface PatchAppArguments extends BaseArguments {
  id: number;
  iconBackground?: string;
  force?: boolean;
  path?: string;
  visibility?: AppVisibility;
  showAppDefinition?: boolean;
  template?: boolean;
  demoMode?: boolean;
  locked?: AppLock;
  showAppsembleOAuth2Login?: boolean;
  showAppsembleLogin?: boolean;
  displayAppMemberName?: boolean;
  enableSelfRegistration?: boolean;
}

export const command = 'patch';
export const description = 'Change the settings of an app without having the entire source.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .option('id', {
      description: 'Id of the app to patch.',
      demandOption: true,
    })
    .option('iconBackground', {
      description: 'The background color to use for the icon in opaque contexts.',
    })
    .option('path', {
      description: 'Path to be used to determine the URL path of the app',
    })
    .option('visibility', {
      description: 'Visibility of the app in the public app store.',
      choices: ['public', 'unlisted', 'private'],
    })
    .option('showAppDefinition', {
      description: 'Whether to expose the app definition in Appsemble studio.',
      type: 'boolean',
    })
    .option('template', {
      description: 'Whether to mark the app as template',
      type: 'boolean',
    })
    .option('demoMode', {
      description: 'Whether the app should be used in demo mode',
      type: 'boolean',
    })
    .option('locked', {
      description: 'Change the value of AppLock for your app.',
      type: 'string',
      choices: ['fullLock', 'studioLock', 'unlocked'],
    })
    .option('showAppsembleOAuth2Login', {
      description: 'Whether the Appsemble OAuth2 login method should be shown',
      type: 'boolean',
    })
    .option('showAppsembleLogin', {
      description: 'Whether the Appsemble password login method should be shown',
      type: 'boolean',
    })
    .option('enableSelfRegistration', {
      description: 'Whether new users should be able to register themselves',
      type: 'boolean',
    })
    .option('displayAppMemberName', {
      description: 'Whether to display the app member name in the title bar',
      type: 'boolean',
    })
    .option('force', {
      description: 'Whether the lock property should be ignored',
      type: 'boolean',
    });
}

export async function handler({
  clientCredentials,
  id,
  remote,
  ...args
}: PatchAppArguments): Promise<void> {
  await authenticate(remote, 'apps:write', clientCredentials);

  logger.info(`Patching app ${id}`);
  await patchApp({
    ...args,
    id,
    remote,
  });
}
