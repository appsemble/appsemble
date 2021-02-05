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

interface UpdateAppParams {
  /**
   * The OAuth2 client credentials to use.
   */
  clientCredentials: string;

  /**
   * If specified, the context matching this name is used, overriding command line flags.
   */
  context?: string;

  /**
   * The ID of the app to update.
   */
  id?: number;

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
 * @param argv - The command line options used for updating the app.
 */
export async function updateApp({
  clientCredentials,
  context,
  path,
  ...options
}: UpdateAppParams): Promise<void> {
  try {
    const file = await fs.stat(path);
    const formData = new FormData();
    let appsembleContext: AppsembleContext;

    if (file.isFile()) {
      // Assuming file is App YAML
      const data = await fs.readFile(path, 'utf8');
      const app = yaml.safeLoad(data);
      formData.append('yaml', data);
      formData.append('definition', JSON.stringify(app));
    } else {
      appsembleContext = await traverseAppDirectory(path, context, formData);
    }

    const remote = appsembleContext?.remote ?? options.remote;
    const id = appsembleContext?.id ?? options.id;
    const template = appsembleContext?.template ?? options.template ?? false;
    const isPrivate = appsembleContext?.private ?? options.private;
    logger.info(`App id: ${id}`);
    logger.verbose(`App remote: ${remote}`);
    logger.verbose(`App is template: ${inspect(template, { colors: true })}`);
    logger.verbose(`App is private: ${inspect(isPrivate, { colors: true })}`);
    if (!id) {
      throw new AppsembleError(
        'The app id must be passed as a command line flag or in the context',
      );
    }
    formData.append('template', String(template));
    formData.append('private', String(isPrivate));

    await authenticate(remote, 'apps:write', clientCredentials);
    const { data } = await axios.patch(`/api/apps/${id}`, formData, { baseURL: remote });

    if (file.isDirectory()) {
      // After uploading the app, upload block styles and messages if they are available
      await traverseBlockThemes(path, data.id);
      await uploadMessages(path, data.id);
    }

    const { host, protocol } = new URL(remote);
    logger.info(`Successfully updated app ${data.definition.name}! 🙌`);
    logger.info(`App URL: ${protocol}//${data.path}.${data.OrganizationId}.${host}`);
    logger.info(`App store page: ${new URL(`/apps/${data.id}`, remote)}`);
  } catch (error: unknown) {
    if (error instanceof yaml.YAMLException) {
      logger.error(`The YAML in ${path} is invalid.`);
    }

    throw error;
  }
}
