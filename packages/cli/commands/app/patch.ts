import { authenticate, logger } from '@appsemble/node-utils';
import { type App, type AppVisibility } from '@appsemble/types';
import axios from 'axios';
import FormData from 'form-data';
import { type Argv } from 'yargs';

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
  showAppsembleOAuth2Login?: boolean;
  showAppsembleLogin?: boolean;
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
  const formData = new FormData();
  if (args.path) {
    logger.info(`Setting app path to ${args.path}`);
    formData.append('path', args.path);
  }
  if (args.force) {
    formData.append('force', String(args.force));
  }
  if (args.demoMode) {
    logger.info(`Setting app demo mode to ${args.demoMode}`);
    formData.append('demoMode', String(args.demoMode));
  }
  if (args.template) {
    logger.info(`Setting template to ${args.template}`);
    formData.append('template', String(args.template));
  }
  if (args.visibility) {
    logger.info(`Setting app visibility to ${args.visibility}`);
    formData.append('visibility', args.visibility);
  }
  if (args.iconBackground) {
    logger.info(`Setting app icon background to ${args.iconBackground}`);
    formData.append('iconBackground', args.iconBackground);
  }
  if (args.showAppDefinition) {
    logger.info(`Setting showAppDefinition to ${args.showAppDefinition}`);
    formData.append('showAppDefinition', String(args.showAppDefinition));
  }
  if (args.showAppsembleLogin) {
    logger.info(`Setting showAppsembleLogin to ${args.showAppsembleLogin}`);
    formData.append('showAppsembleLogin', String(args.showAppsembleLogin));
  }
  if (args.showAppsembleOAuth2Login) {
    logger.info(`Setting showAppsembleOAuth2Login to ${args.showAppsembleOAuth2Login}`);
    formData.append('showAppsembleOAuth2Login', String(args.showAppsembleOAuth2Login));
  }
  if (args.enableSelfRegistration) {
    logger.info(`Setting enableSelfRegistration to ${args.enableSelfRegistration}`);
    formData.append('enableSelfRegistration', String(args.enableSelfRegistration));
  }
  try {
    await axios.patch<App>(`/api/apps/${id}`, formData);
    logger.info(`Successfully updated app with id ${id}`);
  } catch (error) {
    logger.error(error);
  }
}
