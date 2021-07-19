import { randomBytes } from 'crypto';
import { URL, URLSearchParams } from 'url';

import * as types from '@appsemble/types';
import { forbidden } from '@hapi/boom';
import { addMinutes } from 'date-fns';
import yaml from 'js-yaml';
import { omit } from 'lodash';

import * as models from '../models';
import { argv } from './argv';

/**
 * Resolves the icon url for an app based on whether it’s present and when it was updated.
 *
 * @param app - The app to resolve the icon url for.
 * @returns A URL that can be safely cached.
 */
export function resolveIconUrl(app: models.App): string {
  const hasIcon = app.get('hasIcon') ?? Boolean(app.icon);

  if (hasIcon) {
    return `/api/apps/${app.id}/icon?${new URLSearchParams({
      maskable: 'true',
      updated: app.updated.toISOString(),
    })}`;
  }

  const organizationHasIcon = app.Organization?.get('hasIcon');
  if (organizationHasIcon) {
    return `/api/organizations/${app.OrganizationId}/icon?${new URLSearchParams({
      background: app.iconBackground || '#ffffff',
      maskable: 'true',
      updated: app.Organization.updated.toISOString(),
    })}`;
  }

  return null;
}

/**
 * Normalizes an app record for consistant return values.
 *
 * @param record - The sequelize App model to normalize.
 * @param omittedValues - A list of fields to omit from the result.
 * @returns An app resource that can be safely returned from the API.
 */
export function getAppFromRecord(
  record: models.App,
  omittedValues: (keyof types.App)[] = [],
): Partial<types.App> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { anchors, ...definition } = record.definition;

  const result: types.App = {
    id: record.id,
    $created: record.created.toISOString(),
    $updated: record.updated.toISOString(),
    domain: record.domain || null,
    path: record.path,
    private: Boolean(record.private),
    locked: Boolean(record.locked),
    hasIcon: record.get('hasIcon') ?? Boolean(record.icon),
    hasMaskableIcon: record.get('hasMaskableIcon') ?? Boolean(record.maskableIcon),
    iconBackground: record.iconBackground || '#ffffff',
    iconUrl: resolveIconUrl(record),
    longDescription: record.longDescription,
    definition,
    yaml:
      record.AppSnapshots?.[0]?.yaml ??
      (!omittedValues.includes('yaml') && yaml.dump(record.definition)),
    showAppsembleLogin: record.showAppsembleLogin ?? true,
    rating:
      record.RatingAverage == null
        ? undefined
        : { count: record.RatingCount, average: record.RatingAverage },
    resources: record.template && record.Resources?.length ? true : undefined,
    OrganizationId: record.OrganizationId,
    OrganizationName: record?.Organization?.name,
    screenshotUrls: record.AppScreenshots?.map(
      ({ id }) => `/api/apps/${record.id}/screenshots/${id}`,
    ),
    messages: record.messages,
  };

  return omit(result, omittedValues);
}

export async function createOAuth2AuthorizationCode(
  app: models.App,
  redirectUri: string,
  scope: string,
  user: models.User,
): Promise<types.OAuth2AuthorizationCode> {
  const appHost = `${app.path}.${app.OrganizationId}.${new URL(argv.host).hostname}`;
  const redirectHost = new URL(redirectUri).hostname;
  if (redirectHost !== appHost && redirectHost !== app.domain) {
    throw forbidden('Invalid redirectUri');
  }

  const { code } = await models.OAuth2AuthorizationCode.create({
    AppId: app.id,
    code: randomBytes(12).toString('hex'),
    expires: addMinutes(new Date(), 10),
    redirectUri,
    scope,
    UserId: user.id,
  });
  return {
    code,
  };
}
