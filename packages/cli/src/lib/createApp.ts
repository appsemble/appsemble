import { createReadStream, existsSync, promises as fs, ReadStream } from 'fs';
import { join, parse } from 'path';
import { URL } from 'url';
import { inspect } from 'util';

import { AppsembleError, logger, readData, writeData } from '@appsemble/node-utils';
import axios from 'axios';
import FormData from 'form-data';
import { readdir } from 'fs-extra';

import { AppsembleContext, AppsembleRC } from '../types';
import { authenticate } from './authentication';
import { createResource } from './createResource';
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

  /**
   * Whether the API should be called with a dry run.
   */
  dryRun: boolean;

  /**
   * Whether resources from the `resources` directory should be created after creating the app.
   */
  resources: boolean;

  /**
   * If the app context is specified,
   * modify it for the current context to include the id of the created app.
   */
  modifyContext: boolean;
}

/**
 * Create a new App.
 *
 * @param options - The options to use for creating an app.
 */
export async function createApp({
  clientCredentials,
  context,
  dryRun,
  modifyContext,
  path,
  resources,
  ...options
}: CreateAppParams): Promise<void> {
  const file = await fs.stat(path);
  const formData = new FormData();
  let appsembleContext: AppsembleContext;
  let rc: AppsembleRC;

  if (file.isFile()) {
    // Assuming file is App YAML
    const [app, data] = await readData(path);
    formData.append('yaml', data);
    formData.append('definition', JSON.stringify(app));
  } else {
    [appsembleContext, rc] = await traverseAppDirectory(path, context, formData);
  }

  const remote = appsembleContext.remote ?? options.remote;
  const organizationId = appsembleContext.organization ?? options.organization;
  const template = appsembleContext.template ?? options.template ?? false;
  const isPrivate = appsembleContext.private ?? options.private;
  const iconBackground = appsembleContext.iconBackground ?? options.iconBackground;
  const icon = options.icon ?? appsembleContext.icon;
  const maskableIcon = options.maskableIcon ?? appsembleContext.maskableIcon;
  logger.verbose(`App remote: ${remote}`);
  logger.verbose(`App organzation: ${organizationId}`);
  logger.verbose(`App is template: ${inspect(template, { colors: true })}`);
  logger.verbose(`App is private: ${inspect(isPrivate, { colors: true })}`);
  logger.verbose(`Icon background: ${iconBackground}`);
  if (!organizationId) {
    throw new AppsembleError(
      'An organization id must be passed as a command line flag or in the context',
    );
  }
  formData.append('OrganizationId', organizationId);
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

  await authenticate(
    remote,
    resources ? 'apps:write resources:write' : 'apps:write',
    clientCredentials,
  );
  const { data } = await axios.post('/api/apps', formData, { baseURL: remote, params: { dryRun } });

  if (dryRun) {
    logger.info('Skipped uploading block themes and app messages.');
    logger.info('Successfully ran dry run. The app should be valid when creating it.');
    return;
  }

  if (file.isDirectory() && !dryRun) {
    // After uploading the app, upload block styles and messages if they are available
    await traverseBlockThemes(path, data.id, remote, false);
    await uploadMessages(path, data.id, remote, false);

    if (resources && existsSync(join(path, 'resources'))) {
      const resourcePath = join(path, 'resources');
      try {
        const resourceFiles = await fs.readdir(resourcePath, { withFileTypes: true });
        for (const resource of resourceFiles) {
          if (resource.isFile()) {
            const { name } = parse(resource.name);
            await createResource({
              appId: data.id,
              path: join(resourcePath, resource.name),
              remote,
              resourceName: name,
            });
          } else if (resource.isDirectory()) {
            const subDirectoryResources = await readdir(join(resourcePath, resource.name), {
              withFileTypes: true,
            });

            for (const subResource of subDirectoryResources.filter((s) => s.isFile())) {
              await createResource({
                appId: data.id,
                path: join(resourcePath, resource.name, subResource.name),
                remote,
                resourceName: resource.name,
              });
            }
          }
        }
      } catch (error: unknown) {
        logger.error('Something went wrong when creating resources:');
        logger.error(error);
      }
    }
  }

  if (modifyContext && appsembleContext && context && !dryRun) {
    rc.context[context].id = data.id;
    await writeData(join(path, '.appsemblerc.yaml'), rc);

    logger.info(`Updated .appsemblerc: Set context.${context}.id to ${data.id}`);
  }

  const { host, protocol } = new URL(remote);
  logger.info(`Successfully created app ${data.definition.name}! 🙌`);
  logger.info(`App URL: ${protocol}//${data.path}.${data.OrganizationId}.${host}`);
  logger.info(`App store page: ${new URL(`/apps/${data.id}`, remote)}`);
}
