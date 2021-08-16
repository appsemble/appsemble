import { createReadStream, promises as fs, ReadStream } from 'fs';
import { URL } from 'url';
import { inspect } from 'util';

import { AppsembleError, logger, readData } from '@appsemble/node-utils';
import axios from 'axios';
import FormData from 'form-data';

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

  /**
   * Whether the locked property should be ignored.
   */
  force: boolean;

  /**
   * The icon to upload.
   */
  icon: NodeJS.ReadStream | ReadStream;

  /**
   * The background color to use for the icon in opaque contexts.
   */
  iconBackground: string;

  /**
   * The maskable icon to upload.
   */
  maskableIcon: NodeJS.ReadStream | ReadStream;
}

/**
 * Create a new App.
 *
 * @param argv - The command line options used for updating the app.
 */
export async function updateApp({
  clientCredentials,
  context,
  force,
  path,
  ...options
}: UpdateAppParams): Promise<void> {
  const file = await fs.stat(path);
  const formData = new FormData();
  let appsembleContext: AppsembleContext;

  if (file.isFile()) {
    const [app, data] = await readData(path);
    formData.append('yaml', data);
    formData.append('definition', JSON.stringify(app));
  } else {
    [appsembleContext] = await traverseAppDirectory(path, context, formData);
  }

  const remote = appsembleContext.remote ?? options.remote;
  const id = appsembleContext.id ?? options.id;
  const template = appsembleContext.template ?? options.template ?? false;
  const isPrivate = appsembleContext.private ?? options.private;
  const iconBackground = appsembleContext.iconBackground ?? options.iconBackground;
  const icon = options.icon ?? appsembleContext.icon;
  const maskableIcon = options.maskableIcon ?? appsembleContext.maskableIcon;
  logger.info(`App id: ${id}`);
  logger.verbose(`App remote: ${remote}`);
  logger.verbose(`App is template: ${inspect(template, { colors: true })}`);
  logger.verbose(`App is private: ${inspect(isPrivate, { colors: true })}`);
  logger.verbose(`Icon background: ${iconBackground}`);
  logger.verbose(`Force update: ${inspect(force, { colors: true })}`);
  if (!id) {
    throw new AppsembleError('The app id must be passed as a command line flag or in the context');
  }
  formData.append('force', String(force));
  formData.append('template', String(template));
  formData.append('private', String(isPrivate));
  formData.append('iconBackground', iconBackground);
  if (icon) {
    const realIcon = typeof icon === 'string' ? createReadStream(icon) : icon;
    logger.info(`Using icon from ${(realIcon as ReadStream).path ?? 'stdin'}`);
    formData.append('icon', realIcon);
  }
  if (maskableIcon) {
    const realIcon =
      typeof maskableIcon === 'string' ? createReadStream(maskableIcon) : maskableIcon;
    logger.info(`Using icon from ${(realIcon as ReadStream).path ?? 'stdin'}`);
    formData.append('icon', realIcon);
  }

  await authenticate(remote, 'apps:write', clientCredentials);
  const { data } = await axios.patch(`/api/apps/${id}`, formData, { baseURL: remote });

  if (file.isDirectory()) {
    // After uploading the app, upload block styles and messages if they are available
    await traverseBlockThemes(path, data.id, remote, force);
    await uploadMessages(path, data.id, remote, force);
  }

  const { host, protocol } = new URL(remote);
  logger.info(`Successfully updated app ${data.definition.name}! 🙌`);
  logger.info(`App URL: ${protocol}//${data.path}.${data.OrganizationId}.${host}`);
  logger.info(`App store page: ${new URL(`/apps/${data.id}`, remote)}`);
}
