import {
  getCompressedFileMeta,
  readFixture,
  resolveFixture,
  uploadAsset,
} from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import JSZip from 'jszip';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppMessages,
  AppReadme,
  AppScreenshot,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let user: User;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('exportApp', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv(argv);
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should not allow exporting resources if the user does not have sufficient permissions', async () => {
    const appWithResources = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        resources: {
          testResource: {
            schema: {
              type: 'object',
              required: ['bar'],
              properties: { bar: { type: 'string' }, testResourceId: { type: 'number' } },
            },
            roles: ['$public'],
            references: {
              testResourceId: {
                resource: 'testResource',
                create: {
                  trigger: ['update'],
                },
              },
            },
          },
        },
      },
      icon: await readFixture('nodejs-logo.png'),
      OrganizationId: organization.id,
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
    });
    const { Resource } = await getAppDB(appWithResources.id);
    await Resource.create({
      type: 'testResource',
      data: { foo: 'bar' },
    });
    await OrganizationMember.update({ role: 'Member' }, { where: { UserId: user.id } });
    authorizeStudio();
    const response = await request.get(`/api/apps/${appWithResources.id}/export?resources=true`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient organization permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should not allow exporting assets if the user does not have sufficient permissions', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      icon: await readFixture('nodejs-logo.png'),
      OrganizationId: organization.id,
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
    });
    const { Asset } = await getAppDB(app.id);
    await Asset.create({
      filename: 'icon.png',
      mime: 'image/png',
      data: await readFixture('nodejs-logo.png'),
    });
    await OrganizationMember.update({ role: 'Member' }, { where: { UserId: user.id } });
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/export?assets=true`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User does not have sufficient organization permissions.",
        "statusCode": 403,
      }
    `);
  });

  it('should not allow for exporting unlisted apps if the user is not in the same organization as app.', async () => {
    await Organization.create({ id: 'xkcd', name: 'Test Organization 2' });
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      OrganizationId: 'xkcd',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      visibility: 'unlisted',
    });
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/export`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not a member of this organization.",
        "statusCode": 403,
      }
    `);
  });

  it('should not allow for exporting apps with hidden app definitions if the user is not in the same organization as the app', async () => {
    await Organization.create({ id: 'xkcd', name: 'Test Organization 2' });
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
      },
      OrganizationId: 'xkcd',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      showAppDefinition: false,
    });
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/export`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "User is not a member of this organization.",
        "statusCode": 403,
      }
    `);
  });

  it('should return a zip file', async () => {
    const app = await App.create(
      {
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [{ name: 'Test Page' }],
        },
        sharedStyle: `
        * {
          color: var(--link-color)
        }`,
        coreStyle: `
        * {
          color: var(--primary-color)
        }`,
        vapidPrivateKey: 'b',
        vapidPublicKey: 'a',
        OrganizationId: organization.id,
        icon: await readFixture('nodejs-logo.png'),
      },
      { raw: true },
    );
    await AppMessages.create({ AppId: app.id, language: 'en', messages: [{ test: 'test' }] });

    vi.useRealTimers();
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/export`, {
      responseType: 'stream',
    });
    const zip = new JSZip();

    const dataBuffer: Buffer = await new Promise((resolve, reject) => {
      const chunks: any[] = [];

      // Listen for data events and collect chunks
      response.data.on('data', (chunk: any) => chunks.push(chunk));
      response.data.on('end', () => resolve(Buffer.concat(chunks)));
      response.data.on('error', reject);
    });
    const archive = await zip.loadAsync(dataBuffer);

    expect(Object.keys(archive.files)).toStrictEqual([
      'app-definition.yaml',
      'theme/',
      'theme/core/',
      'theme/core/index.css',
      'theme/shared/',
      'theme/shared/index.css',
      'i18n/',
      'i18n/en.json',
      'icon.png',
    ]);

    expect(await archive.file('app-definition.yaml')?.async('text')).toMatchInlineSnapshot(
      `
        "name: Test App
        defaultPage: Test Page
        pages:
          - name: Test Page
        "
      `,
    );
    expect(await archive.file('theme/core/index.css')?.async('text')).toMatchInlineSnapshot(`
      "
              * {
                color: var(--primary-color)
              }"
    `);
    expect(await archive.file('theme/shared/index.css')?.async('text')).toMatchInlineSnapshot(`
      "
              * {
                color: var(--link-color)
              }"
    `);
    expect(await archive.file('i18n/en.json')?.async('text')).toMatchInlineSnapshot(
      '"[{"test":"test"}]"',
    );
  });

  it('should export readmes', async () => {
    const app = await App.create(
      {
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [{ name: 'Test Page' }],
        },
        sharedStyle: `
        * {
          color: var(--link-color)
        }`,
        coreStyle: `
        * {
          color: var(--primary-color)
        }`,
        vapidPrivateKey: 'b',
        vapidPublicKey: 'a',
        OrganizationId: organization.id,
        icon: await readFixture('nodejs-logo.png'),
      },
      { raw: true },
    );
    await AppMessages.create({ AppId: app.id, language: 'en', messages: [{ test: 'test' }] });

    await AppReadme.create({
      AppId: app.id,
      file: Buffer.from('Default'),
      language: 'unspecified',
    });

    await AppReadme.create({
      AppId: app.id,
      file: Buffer.from('English'),
      language: 'en',
    });

    await AppReadme.create({
      AppId: app.id,
      file: Buffer.from('Dutch'),
      language: 'nl',
    });

    vi.useRealTimers();
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/export?readmes=true`, {
      responseType: 'stream',
    });
    const zip = new JSZip();

    const dataBuffer: Buffer = await new Promise((resolve, reject) => {
      const chunks: any[] = [];

      // Listen for data events and collect chunks
      response.data.on('data', (chunk: any) => chunks.push(chunk));
      response.data.on('end', () => resolve(Buffer.concat(chunks)));
      response.data.on('error', reject);
    });
    const archive = await zip.loadAsync(dataBuffer);

    expect(Object.keys(archive.files)).toStrictEqual([
      'app-definition.yaml',
      'theme/',
      'theme/core/',
      'theme/core/index.css',
      'theme/shared/',
      'theme/shared/index.css',
      'i18n/',
      'i18n/en.json',
      'README.md',
      'README.en.md',
      'README.nl.md',
      'icon.png',
    ]);

    expect(await archive.file('app-definition.yaml')?.async('text')).toMatchInlineSnapshot(
      `
        "name: Test App
        defaultPage: Test Page
        pages:
          - name: Test Page
        "
      `,
    );
    expect(await archive.file('theme/core/index.css')?.async('text')).toMatchInlineSnapshot(`
      "
              * {
                color: var(--primary-color)
              }"
    `);
    expect(await archive.file('theme/shared/index.css')?.async('text')).toMatchInlineSnapshot(`
      "
              * {
                color: var(--link-color)
              }"
    `);
    expect(await archive.file('i18n/en.json')?.async('text')).toMatchInlineSnapshot(
      '"[{"test":"test"}]"',
    );
    expect(await archive.file('README.md')?.async('nodebuffer')).toStrictEqual(
      Buffer.from('Default'),
    );
    expect(await archive.file('README.en.md')?.async('nodebuffer')).toStrictEqual(
      Buffer.from('English'),
    );
    expect(await archive.file('README.nl.md')?.async('nodebuffer')).toStrictEqual(
      Buffer.from('Dutch'),
    );
  });

  it('should export screenshots', async () => {
    const app = await App.create(
      {
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [{ name: 'Test Page' }],
        },
        sharedStyle: `
        * {
          color: var(--link-color)
        }`,
        coreStyle: `
        * {
          color: var(--primary-color)
        }`,
        vapidPrivateKey: 'b',
        vapidPublicKey: 'a',
        OrganizationId: organization.id,
        icon: await readFixture('nodejs-logo.png'),
      },
      { raw: true },
    );
    await AppMessages.create({ AppId: app.id, language: 'en', messages: [{ test: 'test' }] });

    await AppScreenshot.create({
      AppId: app.id,
      screenshot: await readFixture('standing.png'),
      mime: 'image/png',
      height: 247,
      width: 474,
      index: 0,
      language: 'unspecified',
    });

    await AppScreenshot.create({
      AppId: app.id,
      screenshot: await readFixture('en-standing.png'),
      mime: 'image/png',
      height: 247,
      width: 474,
      index: 0,
      language: 'en',
    });

    await AppScreenshot.create({
      AppId: app.id,
      screenshot: await readFixture('nl-standing.png'),
      mime: 'image/png',
      height: 247,
      width: 474,
      index: 0,
      language: 'nl',
    });

    vi.useRealTimers();
    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/export?screenshots=true`, {
      responseType: 'stream',
    });
    const zip = new JSZip();

    const dataBuffer: Buffer = await new Promise((resolve, reject) => {
      const chunks: any[] = [];

      // Listen for data events and collect chunks
      response.data.on('data', (chunk: any) => chunks.push(chunk));
      response.data.on('end', () => resolve(Buffer.concat(chunks)));
      response.data.on('error', reject);
    });
    const archive = await zip.loadAsync(dataBuffer);

    expect(Object.keys(archive.files)).toStrictEqual([
      'app-definition.yaml',
      'theme/',
      'theme/core/',
      'theme/core/index.css',
      'theme/shared/',
      'theme/shared/index.css',
      'i18n/',
      'i18n/en.json',
      'screenshots/',
      'screenshots/0.png',
      'screenshots/en/',
      'screenshots/en/0.png',
      'screenshots/nl/',
      'screenshots/nl/0.png',
      'icon.png',
    ]);

    expect(await archive.file('app-definition.yaml')?.async('text')).toMatchInlineSnapshot(
      `
        "name: Test App
        defaultPage: Test Page
        pages:
          - name: Test Page
        "
      `,
    );
    expect(await archive.file('theme/core/index.css')?.async('text')).toMatchInlineSnapshot(`
      "
              * {
                color: var(--primary-color)
              }"
    `);
    expect(await archive.file('theme/shared/index.css')?.async('text')).toMatchInlineSnapshot(`
      "
              * {
                color: var(--link-color)
              }"
    `);
    expect(await archive.file('i18n/en.json')?.async('text')).toMatchInlineSnapshot(
      '"[{"test":"test"}]"',
    );
    expect(await archive.file('screenshots/0.png')?.async('nodebuffer')).toStrictEqual(
      await readFixture('standing.png'),
    );
    expect(await archive.file('screenshots/en/0.png')?.async('nodebuffer')).toStrictEqual(
      await readFixture('en-standing.png'),
    );
    expect(await archive.file('screenshots/nl/0.png')?.async('nodebuffer')).toStrictEqual(
      await readFixture('nl-standing.png'),
    );
  });

  it('should allow exporting assets if the user has sufficient permissions', async () => {
    const app = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        pages: [{ name: 'Test Page' }],
      },
      sharedStyle: `
      * {
        color: var(--link-color)
      }`,
      coreStyle: `
      * {
        color: var(--primary-color)
      }`,
      OrganizationId: organization.id,
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
    });

    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      ...getCompressedFileMeta({ mime: 'image/png', filename: 'nodejs-logo.png' }),
    });

    vi.useRealTimers();

    await uploadAsset(app.id, {
      id: asset.id,
      mime: 'image/png',
      path: resolveFixture('nodejs-logo.png'),
    });

    authorizeStudio();
    const response = await request.get(`/api/apps/${app.id}/export?assets=true`, {
      responseType: 'stream',
    });
    const zip = new JSZip();

    const dataBuffer: Buffer = await new Promise((resolve, reject) => {
      const chunks: any[] = [];

      // Listen for data events and collect chunks
      response.data.on('data', (chunk: any) => chunks.push(chunk));
      response.data.on('end', () => resolve(Buffer.concat(chunks)));
      response.data.on('error', reject);
    });
    const archive = await zip.loadAsync(dataBuffer);

    expect(Object.keys(archive.files)).toStrictEqual([
      'app-definition.yaml',
      'theme/',
      'theme/core/',
      'theme/core/index.css',
      'theme/shared/',
      'theme/shared/index.css',
      'i18n/',
      'assets/',
      'assets/nodejs-logo.avif',
    ]);

    expect(await archive.file('app-definition.yaml')?.async('text')).toMatchInlineSnapshot(
      `
        "name: Test App
        defaultPage: Test Page
        pages:
          - name: Test Page
        "
      `,
    );
    expect(await archive.file('theme/core/index.css')?.async('text')).toMatchInlineSnapshot(`
      "
            * {
              color: var(--primary-color)
            }"
    `);
    expect(await archive.file('theme/shared/index.css')?.async('text')).toMatchInlineSnapshot(`
      "
            * {
              color: var(--link-color)
            }"
    `);
    expect(await archive.file('assets/nodejs-logo.avif')?.async('nodebuffer')).toStrictEqual(
      await sharp(await readFixture('nodejs-logo.png'))
        .toFormat('avif')
        .toBuffer(),
    );
  });

  it('should allow exporting resources if the user has sufficient permissions', async () => {
    const appWithResources = await App.create({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        resources: {
          testResource: {
            schema: {
              type: 'object',
              required: ['bar'],
              properties: { bar: { type: 'string' }, testResourceId: { type: 'number' } },
            },
            roles: ['$public'],
            references: {
              testResourceId: {
                resource: 'testResource',
                create: {
                  trigger: ['update'],
                },
              },
            },
          },
        },
      },
      sharedStyle: `
      * {
        color: var(--link-color)
      }`,
      coreStyle: `
      * {
        color: var(--primary-color)
      }`,
      OrganizationId: organization.id,
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
    });
    await AppMessages.create({
      AppId: appWithResources.id,
      language: 'en',
      messages: [{ test: 'test' }],
    });
    const { Resource } = await getAppDB(appWithResources.id);
    await Resource.create({
      type: 'testResource',
      data: { foo: 'bar' },
    });

    vi.useRealTimers();
    authorizeStudio();
    const response = await request.get(`/api/apps/${appWithResources.id}/export?resources=true`, {
      responseType: 'stream',
    });
    const zip = new JSZip();

    const dataBuffer: Buffer = await new Promise((resolve, reject) => {
      const chunks: any[] = [];

      // Listen for data events and collect chunks
      response.data.on('data', (chunk: any) => chunks.push(chunk));
      response.data.on('end', () => resolve(Buffer.concat(chunks)));
      response.data.on('error', reject);
    });
    const archive = await zip.loadAsync(dataBuffer);

    expect(Object.keys(archive.files)).toStrictEqual([
      'app-definition.yaml',
      'theme/',
      'theme/core/',
      'theme/core/index.css',
      'theme/shared/',
      'theme/shared/index.css',
      'i18n/',
      'i18n/en.json',
      'resources/',
      'resources/testResource.json',
    ]);

    expect(await archive.file('app-definition.yaml')?.async('text')).toMatchInlineSnapshot(
      `
        "name: Test App
        defaultPage: Test Page
        resources:
          testResource:
            schema:
              type: object
              required:
                - bar
              properties:
                bar:
                  type: string
                testResourceId:
                  type: number
            roles:
              - $public
            references:
              testResourceId:
                resource: testResource
                create:
                  trigger:
                    - update
        "
      `,
    );
    expect(await archive.file('theme/core/index.css')?.async('text')).toMatchInlineSnapshot(`
      "
            * {
              color: var(--primary-color)
            }"
    `);
    expect(await archive.file('theme/shared/index.css')?.async('text')).toMatchInlineSnapshot(`
      "
            * {
              color: var(--link-color)
            }"
    `);
    expect(await archive.file('i18n/en.json')?.async('text')).toMatchInlineSnapshot(
      '"[{"test":"test"}]"',
    );
    expect(await archive.file('resources/testResource.json')?.async('text')).toMatchInlineSnapshot(
      '"[{"foo":"bar","id":1,"$created":"1970-01-01T00:00:00.000Z","$updated":"1970-01-01T00:00:00.000Z","$clonable":false,"$seed":false}]"',
    );
  });
});
