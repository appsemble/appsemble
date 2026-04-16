import { getRemapperContext } from '@appsemble/node-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import { compareApps, getApp, handleAppValidationError } from './app.js';
import { setArgv } from './argv.js';
import { App, AppMessages, Organization } from '../models/index.js';
import { options } from '../options/options.js';

describe('app', () => {
  beforeEach(async () => {
    await Organization.create({
      id: 'test-organization',
      name: 'Test Organization',
    });
  });

  describe('getApp', () => {
    beforeEach(() => {
      setArgv({
        host: 'http://localhost:9999',
      });
    });

    it('should resolve an app by its default domain', async () => {
      const app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
        },
        path: 'test-app',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: 'test-organization',
      });

      const result = await getApp(
        { URL: new URL('http://test-app.test-organization.localhost:9999') },
        {
          attributes: [
            'definition',
            'id',
            'OrganizationId',
            'sharedStyle',
            'coreStyle',
            'vapidPublicKey',
          ],
          raw: true,
        },
      );

      expect(result).toStrictEqual({
        appPath: 'test-app',
        organizationId: 'test-organization',
        app: {
          definition: app.definition,
          id: app.id,
          OrganizationId: app.OrganizationId,
          sharedStyle: app.sharedStyle,
          coreStyle: app.coreStyle,
          vapidPublicKey: app.vapidPublicKey,
        },
      });
    });

    it('should allow passing an optional url parameter', async () => {
      const app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
        },
        path: 'test-app',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: 'test-organization',
      });

      const result = await getApp(
        { URL: new URL('http://localhost:9999') },
        {
          attributes: [
            'definition',
            'id',
            'OrganizationId',
            'sharedStyle',
            'coreStyle',
            'vapidPublicKey',
          ],
          raw: true,
        },
        'http://test-app.test-organization.localhost:9999',
      );

      expect(result).toStrictEqual({
        appPath: 'test-app',
        organizationId: 'test-organization',
        app: {
          definition: app.definition,
          id: app.id,
          OrganizationId: app.OrganizationId,
          sharedStyle: app.sharedStyle,
          coreStyle: app.coreStyle,
          vapidPublicKey: app.vapidPublicKey,
        },
      });
    });

    it('should resolve apps with custom domains', async () => {
      const app = await App.create({
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
        },
        path: 'test-app',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: 'test-organization',
        domain: 'example.com',
      });

      const result = await getApp(
        { URL: new URL('http://example.com') },
        {
          attributes: [
            'definition',
            'id',
            'OrganizationId',
            'sharedStyle',
            'coreStyle',
            'vapidPublicKey',
          ],
          raw: true,
        },
      );

      expect(result).toStrictEqual({
        appPath: undefined,
        organizationId: undefined,
        app: {
          definition: app.definition,
          id: app.id,
          OrganizationId: app.OrganizationId,
          sharedStyle: app.sharedStyle,
          coreStyle: app.coreStyle,
          vapidPublicKey: app.vapidPublicKey,
        },
      });
    });

    it('should resolve if no app is found', async () => {
      const result = await getApp({ URL: new URL('http://my-app.my-org.localhost') }, {});

      expect(result).toStrictEqual({
        appPath: 'my-app',
        organizationId: 'my-org',
        app: undefined,
      });
    });

    it('should resolve if a URL only matches an organization id', async () => {
      const result = await getApp({ URL: new URL('http://my-org.localhost') }, {});

      expect(result).toStrictEqual({
        appPath: undefined,
        organizationId: 'my-org',
        app: undefined,
      });
    });
  });

  describe('getRemapperContext', () => {
    it('should return a message getter with the app context', async () => {
      await Organization.create({ id: 'test' });
      const app = await App.create({
        definition: '',
        vapidPrivateKey: '',
        vapidPublicKey: '',
        OrganizationId: 'test',
      });
      await AppMessages.create({
        AppId: app.id,
        language: 'nl',
        messages: { messageIds: { bye: 'Doei', hello: 'Hallo', word: 'Woord' } },
      });
      await AppMessages.create({
        AppId: app.id,
        language: 'nl-nl',
        messages: { messageIds: { bye: 'Dag', hello: 'Hoi' } },
      });
      await AppMessages.create({
        AppId: app.id,
        language: 'nl-nl-brabants',
        messages: { messageIds: { bye: 'Houdoe' } },
      });

      const remapperContext = await getRemapperContext(
        app.toJSON(),
        'nl-nl-brabants',
        options,
        {} as any,
      );
      const word = remapperContext.getMessage({ id: 'word' });
      const hello = remapperContext.getMessage({ id: 'hello' });
      const bye = remapperContext.getMessage({ id: 'bye' });
      const nothing = remapperContext.getMessage({ id: 'nothing' });

      expect(word.format()).toBe('Woord');
      expect(hello.format()).toBe('Hoi');
      expect(bye.format()).toBe('Houdoe');
      expect(nothing.format()).toBe('{nothing}');
    });
  });

  describe('sortApps', () => {
    it('should sort apps by their app rating in descending order and with no ratings last', () => {
      const apps: Partial<App>[] = [
        {
          id: 2,
          RatingAverage: 5,
          RatingCount: 1,
        },
        {
          id: 1,
          RatingAverage: 5,
          RatingCount: 2,
        },
        {
          id: 4,
        },
        {
          id: 5,
        },
        {
          id: 3,
          RatingAverage: 3,
          RatingCount: 2,
        },
      ];
      const [b, a, d, e, c] = apps;

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      expect(apps.sort(compareApps)).toMatchObject([a, b, c, d, e]);
    });
  });

  describe('handleAppValidationError', () => {
    it('should fall back to the duplicate app path response for non-resource unique errors', () => {
      const thrown = new Error('ctx.throw');
      const ctx = {
        response: {},
        throw() {
          throw thrown;
        },
      } as any;
      const error = Object.assign(new Error('duplicate key value violates unique constraint'), {
        name: 'SequelizeUniqueConstraintError',
        original: {
          code: '23505',
          constraint: 'App_path_OrganizationId_key',
        },
      });

      expect(() =>
        handleAppValidationError(ctx, error, {
          OrganizationId: 'test-organization',
          definition: { name: 'Test App', defaultPage: 'Test Page', pages: [] },
          path: 'test-app',
        }),
      ).toThrow(thrown);

      expect(ctx.response).toStrictEqual({
        body: {
          data: undefined,
          error: 'Conflict',
          message: 'Another app with path “@test-organization/test-app” already exists',
          statusCode: 409,
        },
        status: 409,
      });
    });
  });
});
