import { promises as fs } from 'fs';
import { URL } from 'url';
import { inspect } from 'util';

import { AppsembleError, logger } from '@appsemble/node-utils';
import axios from 'axios';
import FormData from 'form-data';
import yaml from 'js-yaml';

import { AppsembleContext } from '../types';
import { authenticate } from './authentication';
import { traverseAppDirectory } from './traverseAppDirectory';
import { traverseBlockThemes } from './traverseBlockThemes';
import { uploadMessages } from './uploadMessages';

interface CreateAppParams {
  /**
   * The OAuth2 client credentials to use.
   */
  clientCredentials: string;

  /**
   * If specified, the context matching this name is used, overriding command line flags.
   */
  context?: string;

  /**
   * The ID of the organization to upload for.
   */
  organization: string;

  /**
   * The path in which the App YAML is located.
   */
  path: string;

  /**
   * Whether the App should be marked as private.
   */
  private: boolean;

  /**
   * The remote server to create the app on.
   */
  remote: string;

  /**
   * Whether the App should be marked as a template.
   */
  template: boolean;
}

/**
 * Create a new App.
 *
 * @param options - The options to use for creating an app.
 */
export async function createApp({
  clientCredentials,
  context,
  path,
  ...options
}: CreateAppParams): Promise<void> {
  const file = await fs.stat(path);
  const formData = new FormData();
  let appsembleContext: AppsembleContext;

  try {
    if (file.isFile()) {
      // Assuming file is App YAML
      const data = await fs.readFile(path, 'utf8');
      const app = yaml.safeLoad(data);
      formData.append('yaml', data);
      formData.append('definition', JSON.stringify(app));
    } else {
      appsembleContext = await traverseAppDirectory(path, context, formData);
    }
  } catch (error: unknown) {
    if (error instanceof yaml.YAMLException) {
      throw new AppsembleError(`The YAML in ${path} is invalid.\nMessage: ${error.message}`);
    }
    throw error;
  }

  const remote = appsembleContext?.remote ?? options.remote;
  const organizationId = appsembleContext?.organization ?? options.organization;
  const template = appsembleContext?.template ?? options.template ?? false;
  const isPrivate = appsembleContext?.private ?? options.private;
  logger.verbose(`App remote: ${remote}`);
  logger.verbose(`App organzation: ${organizationId}`);
  logger.verbose(`App is template: ${inspect(template, { colors: true })}`);
  logger.verbose(`App is private: ${inspect(isPrivate, { colors: true })}`);
  if (!organizationId) {
    throw new AppsembleError(
      'An organization id must be passed as a command line flag or in the context',
    );
  }
  formData.append('OrganizationId', organizationId);
  formData.append('template', String(template));
  formData.append('private', String(isPrivate));

  await authenticate(remote, 'apps:write', clientCredentials);
  const { data } = await axios.post('/api/apps', formData, { baseURL: remote });

  if (file.isDirectory()) {
    // After uploading the app, upload block styles and messages if they are available
    await traverseBlockThemes(path, data.id);
    await uploadMessages(path, data.id);
  }

  const { host, protocol } = new URL(remote);
  logger.info(`Successfully created app ${data.definition.name}! 🙌`);
  logger.info(`App URL: ${protocol}//${data.path}.${data.OrganizationId}.${host}`);
  logger.info(`App store page: ${new URL(`/apps/${data.id}`, remote)}`);
}
