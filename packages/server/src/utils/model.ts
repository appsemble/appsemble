import { randomBytes } from 'crypto';
import { URL } from 'url';

import * as types from '@appsemble/types';
import { forbidden } from '@hapi/boom';
import { addMinutes } from 'date-fns';
import yaml from 'js-yaml';
import { omit } from 'lodash';

import * as models from '../models';
import { argv } from './argv';

/**
 * Normalizes an app record for consistant return values.
 *
 * @param record - The sequelize App model to normalize.
 * @param omittedValues - A list of fields to omit from the result.
 *
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
    iconUrl: `/api/apps/${record.id}/icon`,
    longDescription: record.longDescription,
    definition,
    yaml: record.yaml || yaml.safeDump(record.definition),
    rating: record.get('RatingCount')
      ? {
          average: record.get('RatingAverage') ? Number(record.get('RatingAverage')) : null,
          count: record.get('RatingCount') ? Number(record.get('RatingCount')) : null,
        }
      : undefined,
    resources: record.template && record.get('ResourceCount') ? true : undefined,
    OrganizationId: record.OrganizationId,
    screenshotUrls: record.AppScreenshots?.map(
      ({ id }) => `/api/apps/${record.id}/screenshots/${id}`,
    ),
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
