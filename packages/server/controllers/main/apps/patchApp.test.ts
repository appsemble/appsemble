import { createFormData } from '@appsemble/node-utils';
import { type App as AppType, PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import stripIndent from 'strip-indent';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppMember,
  BlockVersion,
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

describe('patchApp', () => {
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

    await Organization.create({ id: 'appsemble', name: 'Appsemble' });

    await BlockVersion.create({
      name: 'test',
      OrganizationId: 'appsemble',
      version: '0.0.0',
      parameters: {
        type: 'object',
        properties: {
          foo: {
            type: 'number',
          },
        },
      },
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should update an app', async () => {
    const app = await App.create(
      {
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        path: 'test-app',
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        visibility: 'private',
        yaml: stripIndent(`
          name: Foobar
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.0
        `),
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Foobar",
          "pages": [
            {
              "blocks": [
                {
                  "type": "test",
                  "version": "0.0.0",
                },
              ],
              "name": "Test Page",
            },
          ],
        },
        "demoMode": false,
        "displayAppMemberName": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": "unlocked",
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "private",
        "yaml": "
      name: Foobar
      defaultPage: Test Page
      pages:
        - name: Test Page
          blocks:
            - type: test
              version: 0.0.0
              ",
      }
    `);
  });

  it('should update the email settings', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio(user);
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        emailName: 'Test Email <test@example.com>',
        emailHost: 'smtp.google.com',
        emailUser: 'user',
        emailPassword: 'password',
        emailPort: 123,
        emailSecure: false,
      }),
    );

    const email = await request.get(`/api/apps/${app.id}/email`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "demoMode": false,
        "displayAppMemberName": false,
        "domain": null,
        "emailName": "Test Email <test@example.com>",
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": "unlocked",
        "path": "test-app",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
    expect(email).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "emailHost": "smtp.google.com",
        "emailName": "Test Email <test@example.com>",
        "emailPassword": true,
        "emailPort": 123,
        "emailSecure": false,
        "emailUser": "user",
      }
    `);
  });

  it('should not update a non-existent app', async () => {
    authorizeStudio();
    const response = await request.patch(
      '/api/apps/1',
      createFormData({
        definition: {
          name: 'Foobar',
          defaultPage: 'Test Page',
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not update an app if it is currently locked', async () => {
    const app = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      locked: 'fullLock',
    });

    const form = createFormData({
      definition: {
        name: 'Foobar',
        defaultPage: app.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
    });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}`, form);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "App is currently locked.",
        "statusCode": 403,
      }
    `);
  });

  it('should ignore the lock if force is set to true', async () => {
    const app = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      OrganizationName: 'Test Organization',
      locked: 'fullLock',
    });

    const form = createFormData({
      definition: {
        name: 'Foobar',
        defaultPage: app.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
      force: true,
    });
    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}`, form);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "demoMode": false,
        "displayAppMemberName": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": "fullLock",
        "path": "bar",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
  });

  it('should update the app domain', async () => {
    const app = await App.create({
      path: 'foo',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({ domain: 'appsemble.app' }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "demoMode": false,
        "displayAppMemberName": false,
        "domain": "appsemble.app",
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": "unlocked",
        "path": "foo",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
  });

  it('should set the app domain to null', async () => {
    const app = await App.create(
      {
        path: 'foo',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}`, createFormData({ domain: '' }));

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "demoMode": false,
        "displayAppMemberName": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": "unlocked",
        "path": "foo",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
  });

  it('should delete app controller', async () => {
    const app = await App.create(
      {
        path: 'foo',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
        controllerCode: 'test',
        controllerImplementations: 'test',
      },
      { raw: true },
    );

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({ controllerCode: '', controllerImplementations: '' }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "demoMode": false,
        "displayAppMemberName": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": "unlocked",
        "path": "foo",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
  });

  it('should not update an app of another organization', async () => {
    const newOrganization = await Organization.create({ id: 'Test Organization 2' });
    const app = await App.create({
      path: 'test-app',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: newOrganization.id,
    });

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        definition: {
          name: 'Foobar',
          defaultPage: app.definition.defaultPage,
          pages: [
            {
              name: 'Test Page',
              blocks: [{ type: 'test', version: '0.0.0' }],
            },
          ],
        },
      }),
    );

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

  it('should validate an app on creation', async () => {
    authorizeStudio();
    const response = await request.post('/api/apps', createFormData({ foo: 'bar' }));

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": "OrganizationId",
            "instance": {
              "foo": "bar",
            },
            "message": "requires property "OrganizationId"",
            "name": "required",
            "path": [],
            "property": "instance",
            "schema": {
              "properties": {
                "OrganizationId": {
                  "$ref": "#/components/schemas/Organization/properties/id",
                },
                "controllerCode": {
                  "description": "Custom app logic as a JavaScript string",
                  "type": "string",
                },
                "controllerImplementations": {
                  "description": "Appsemble SDK interfaces implementations",
                  "type": "string",
                },
                "coreStyle": {
                  "description": "The custom style to apply to the core app.",
                  "type": "string",
                },
                "demoMode": {
                  "$ref": "#/components/schemas/App/properties/demoMode",
                },
                "domain": {
                  "$ref": "#/components/schemas/App/properties/domain",
                },
                "icon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "iconBackground": {
                  "description": "The background color to use for the maskable icon.",
                  "pattern": "^#[\\dA-Fa-f]{6}$",
                  "type": "string",
                },
                "maskableIcon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "path": {
                  "$ref": "#/components/schemas/App/properties/path",
                },
                "readmes": {
                  "description": "Readmes to showcase in the store",
                  "items": {
                    "format": "binary",
                    "type": "string",
                  },
                  "type": "array",
                },
                "screenshots": {
                  "description": "Screenshots to showcase in the store",
                  "items": {
                    "format": "binary",
                    "type": "string",
                  },
                  "type": "array",
                },
                "sharedStyle": {
                  "description": "The custom style to apply to all parts of app.",
                  "type": "string",
                },
                "template": {
                  "$ref": "#/components/schemas/App/properties/template",
                },
                "visibility": {
                  "$ref": "#/components/schemas/App/properties/visibility",
                },
                "yaml": {
                  "description": "The original YAML definition used to define the app.",
                  "type": "string",
                },
              },
              "required": [
                "OrganizationId",
                "yaml",
              ],
              "type": "object",
            },
            "stack": "instance requires property "OrganizationId"",
          },
          {
            "argument": "yaml",
            "instance": {
              "foo": "bar",
            },
            "message": "requires property "yaml"",
            "name": "required",
            "path": [],
            "property": "instance",
            "schema": {
              "properties": {
                "OrganizationId": {
                  "$ref": "#/components/schemas/Organization/properties/id",
                },
                "controllerCode": {
                  "description": "Custom app logic as a JavaScript string",
                  "type": "string",
                },
                "controllerImplementations": {
                  "description": "Appsemble SDK interfaces implementations",
                  "type": "string",
                },
                "coreStyle": {
                  "description": "The custom style to apply to the core app.",
                  "type": "string",
                },
                "demoMode": {
                  "$ref": "#/components/schemas/App/properties/demoMode",
                },
                "domain": {
                  "$ref": "#/components/schemas/App/properties/domain",
                },
                "icon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "iconBackground": {
                  "description": "The background color to use for the maskable icon.",
                  "pattern": "^#[\\dA-Fa-f]{6}$",
                  "type": "string",
                },
                "maskableIcon": {
                  "description": "The app icon.",
                  "format": "binary",
                  "type": "string",
                },
                "path": {
                  "$ref": "#/components/schemas/App/properties/path",
                },
                "readmes": {
                  "description": "Readmes to showcase in the store",
                  "items": {
                    "format": "binary",
                    "type": "string",
                  },
                  "type": "array",
                },
                "screenshots": {
                  "description": "Screenshots to showcase in the store",
                  "items": {
                    "format": "binary",
                    "type": "string",
                  },
                  "type": "array",
                },
                "sharedStyle": {
                  "description": "The custom style to apply to all parts of app.",
                  "type": "string",
                },
                "template": {
                  "$ref": "#/components/schemas/App/properties/template",
                },
                "visibility": {
                  "$ref": "#/components/schemas/App/properties/visibility",
                },
                "yaml": {
                  "description": "The original YAML definition used to define the app.",
                  "type": "string",
                },
              },
              "required": [
                "OrganizationId",
                "yaml",
              ],
              "type": "object",
            },
            "stack": "instance requires property "yaml"",
          },
        ],
        "message": "Invalid content types found",
      }
    `);
  });

  it('should validate an app on update', async () => {
    const app = await App.create({
      path: 'foo',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        yaml: stripIndent(`
          name: Foo
        `),
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "argument": "defaultPage",
              "instance": {
                "name": "Foo",
              },
              "message": "requires property "defaultPage"",
              "name": "required",
              "path": [],
              "property": "instance",
              "schema": {
                "additionalProperties": false,
                "description": "An app definition describes what an Appsemble app looks like.",
                "properties": {
                  "anchors": {
                    "description": "Helper property that can be used to store YAML anchors.",
                    "items": {},
                    "minItems": 1,
                    "type": "array",
                  },
                  "containers": {
                    "additionalProperties": false,
                    "description": "Definition of the companion containers to be created.",
                    "items": {
                      "$ref": "#/components/schemas/ContainerDefinition",
                    },
                    "minItems": 1,
                    "type": "array",
                  },
                  "controller": {
                    "$ref": "#/components/schemas/ControllerDefinition",
                  },
                  "cron": {
                    "additionalProperties": {
                      "$ref": "#/components/schemas/CronDefinition",
                    },
                    "description": "A list of cron jobs that are associated with this app.",
                    "minProperties": 1,
                    "type": "object",
                  },
                  "defaultLanguage": {
                    "default": "en",
                    "description": "The default language for the app.",
                    "minLength": 2,
                    "type": "string",
                  },
                  "defaultPage": {
                    "description": "The name of the page that should be displayed when the app is initially loaded.

      This **must** match the name of a page defined for the app.
      ",
                    "type": "string",
                  },
                  "description": {
                    "description": "A short description describing the app.

      This will be displayed on the app store.
      ",
                    "maxLength": 80,
                    "type": "string",
                  },
                  "layout": {
                    "$ref": "#/components/schemas/AppLayoutDefinition",
                    "description": "Properties related to the layout of the app.",
                  },
                  "members": {
                    "$ref": "#/components/schemas/AppMembersDefinition",
                  },
                  "name": {
                    "description": "The human readable name of the app.

      This will be displayed for example on the home screen or in the browser tab.
      ",
                    "maxLength": 30,
                    "minLength": 1,
                    "type": "string",
                  },
                  "notifications": {
                    "description": "The strategy to use for apps to subscribe to push notifications.

      If specified, push notifications can be sent to subscribed users via the _Notifications_ tab in the
      app details page in Appsemble Studio. Setting this to \`opt-in\` allows for users to opt into
      receiving push notifications by pressing the subscribe button in the App settings page. Setting this
      to \`startup\` will cause Appsemble to immediately request for the permission upon opening the app.
      If this is set to \`login\`, the app will request permissions for push notification once the user
      logs in.

      > **Note**: Setting \`notifications\` to \`startup\` is not recommended, due to its invasive nature.
      ",
                    "enum": [
                      "login",
                      "opt-in",
                      "startup",
                    ],
                  },
                  "pages": {
                    "description": "The pages of the app.",
                    "items": {
                      "anyOf": [
                        {
                          "$ref": "#/components/schemas/PageDefinition",
                        },
                        {
                          "$ref": "#/components/schemas/TabsPageDefinition",
                        },
                        {
                          "$ref": "#/components/schemas/FlowPageDefinition",
                        },
                        {
                          "$ref": "#/components/schemas/LoopPageDefinition",
                        },
                        {
                          "$ref": "#/components/schemas/ContainerPageDefinition",
                        },
                      ],
                    },
                    "minItems": 1,
                    "type": "array",
                  },
                  "registry": {
                    "default": null,
                    "description": "The default registry used to pull images for companion containers.",
                    "type": "string",
                  },
                  "resources": {
                    "additionalProperties": {
                      "$ref": "#/components/schemas/ResourceDefinition",
                      "description": "A single resource definition.",
                    },
                    "description": "Resources define how Appsemble can store data for an app.

      The most basic resource has a \`schema\` property and defines the minimal security rules.
      ",
                    "type": "object",
                  },
                  "security": {
                    "$ref": "#/components/schemas/SecurityDefinition",
                    "description": "Role and guest definitions that may be used by the app.",
                  },
                  "theme": {
                    "$ref": "#/components/schemas/Theme",
                  },
                },
                "required": [
                  "name",
                  "defaultPage",
                  "pages",
                ],
                "type": "object",
              },
              "stack": "instance requires property "defaultPage"",
            },
            {
              "argument": "pages",
              "instance": {
                "name": "Foo",
              },
              "message": "requires property "pages"",
              "name": "required",
              "path": [],
              "property": "instance",
              "schema": {
                "additionalProperties": false,
                "description": "An app definition describes what an Appsemble app looks like.",
                "properties": {
                  "anchors": {
                    "description": "Helper property that can be used to store YAML anchors.",
                    "items": {},
                    "minItems": 1,
                    "type": "array",
                  },
                  "containers": {
                    "additionalProperties": false,
                    "description": "Definition of the companion containers to be created.",
                    "items": {
                      "$ref": "#/components/schemas/ContainerDefinition",
                    },
                    "minItems": 1,
                    "type": "array",
                  },
                  "controller": {
                    "$ref": "#/components/schemas/ControllerDefinition",
                  },
                  "cron": {
                    "additionalProperties": {
                      "$ref": "#/components/schemas/CronDefinition",
                    },
                    "description": "A list of cron jobs that are associated with this app.",
                    "minProperties": 1,
                    "type": "object",
                  },
                  "defaultLanguage": {
                    "default": "en",
                    "description": "The default language for the app.",
                    "minLength": 2,
                    "type": "string",
                  },
                  "defaultPage": {
                    "description": "The name of the page that should be displayed when the app is initially loaded.

      This **must** match the name of a page defined for the app.
      ",
                    "type": "string",
                  },
                  "description": {
                    "description": "A short description describing the app.

      This will be displayed on the app store.
      ",
                    "maxLength": 80,
                    "type": "string",
                  },
                  "layout": {
                    "$ref": "#/components/schemas/AppLayoutDefinition",
                    "description": "Properties related to the layout of the app.",
                  },
                  "members": {
                    "$ref": "#/components/schemas/AppMembersDefinition",
                  },
                  "name": {
                    "description": "The human readable name of the app.

      This will be displayed for example on the home screen or in the browser tab.
      ",
                    "maxLength": 30,
                    "minLength": 1,
                    "type": "string",
                  },
                  "notifications": {
                    "description": "The strategy to use for apps to subscribe to push notifications.

      If specified, push notifications can be sent to subscribed users via the _Notifications_ tab in the
      app details page in Appsemble Studio. Setting this to \`opt-in\` allows for users to opt into
      receiving push notifications by pressing the subscribe button in the App settings page. Setting this
      to \`startup\` will cause Appsemble to immediately request for the permission upon opening the app.
      If this is set to \`login\`, the app will request permissions for push notification once the user
      logs in.

      > **Note**: Setting \`notifications\` to \`startup\` is not recommended, due to its invasive nature.
      ",
                    "enum": [
                      "login",
                      "opt-in",
                      "startup",
                    ],
                  },
                  "pages": {
                    "description": "The pages of the app.",
                    "items": {
                      "anyOf": [
                        {
                          "$ref": "#/components/schemas/PageDefinition",
                        },
                        {
                          "$ref": "#/components/schemas/TabsPageDefinition",
                        },
                        {
                          "$ref": "#/components/schemas/FlowPageDefinition",
                        },
                        {
                          "$ref": "#/components/schemas/LoopPageDefinition",
                        },
                        {
                          "$ref": "#/components/schemas/ContainerPageDefinition",
                        },
                      ],
                    },
                    "minItems": 1,
                    "type": "array",
                  },
                  "registry": {
                    "default": null,
                    "description": "The default registry used to pull images for companion containers.",
                    "type": "string",
                  },
                  "resources": {
                    "additionalProperties": {
                      "$ref": "#/components/schemas/ResourceDefinition",
                      "description": "A single resource definition.",
                    },
                    "description": "Resources define how Appsemble can store data for an app.

      The most basic resource has a \`schema\` property and defines the minimal security rules.
      ",
                    "type": "object",
                  },
                  "security": {
                    "$ref": "#/components/schemas/SecurityDefinition",
                    "description": "Role and guest definitions that may be used by the app.",
                  },
                  "theme": {
                    "$ref": "#/components/schemas/Theme",
                  },
                },
                "required": [
                  "name",
                  "defaultPage",
                  "pages",
                ],
                "type": "object",
              },
              "stack": "instance requires property "pages"",
            },
          ],
        },
        "error": "Bad Request",
        "message": "App validation failed",
        "statusCode": 400,
      }
    `);
  });

  it('should validate and update css when updating an app', async () => {
    const app = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const form = createFormData({
      definition: {
        name: 'Foobar',
        defaultPage: app.definition.defaultPage,
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
      coreStyle: 'body { color: yellow; }',
      sharedStyle: 'body { color: blue; }',
    });
    authorizeStudio();
    const response = await request.patch<AppType>(`/api/apps/${app.id}`, form);

    const coreStyle = await request.get(`/api/apps/${response.data.id}/style/core`);
    const sharedStyle = await request.get(`/api/apps/${response.data.id}/style/shared`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "coreStyle": "body { color: yellow; }",
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "demoMode": false,
        "displayAppMemberName": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": "unlocked",
        "path": "bar",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "sharedStyle": "body { color: blue; }",
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
    expect(coreStyle).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/css; charset=utf-8

      body { color: yellow; }
    `);
    expect(sharedStyle).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/css; charset=utf-8

      body { color: blue; }
    `);
  });

  it("should create a new app member with role `cron` if doesn't exist already", async () => {
    const app = await App.create(
      {
        path: 'bar',
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          cron: { testCron: { schedule: '*/5 * * * *', action: { type: 'noop' } } },
        },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );
    authorizeStudio();
    const member = await AppMember.findOne({ where: { AppId: app.id, role: 'cron' } });
    expect(member).toBeNull();
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        yaml: stripIndent(`
          name: 'Test App'
          defaultPage: 'Test Page'
          security:
            cron:
              permissions: []
          pages:
            - name: Test Page
              blocks:
                - type: 'test'
                  version: 0.0.0
          cron:
            testCron:
              schedule: '*/5 * * * *'
              action:
                type: noop
        `),
      }),
    );
    expect(response.status).toBe(200);
    const foundMember = await AppMember.findOne({ where: { AppId: app.id, role: 'cron' } });
    expect(foundMember.dataValues).toMatchObject({
      AppId: app.id,
      role: 'cron',
      email: expect.stringMatching('cron.*example'),
    });
  });

  it('should not allow invalid core stylesheets when updating an app', async () => {
    const app = await App.create(
      {
        path: 'bar',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    const formA = createFormData({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        path: 'a',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
      coreStyle: 'this is invalid css',
    });
    authorizeStudio();
    const responseA = await request.patch(`/api/apps/${app.id}`, formA);

    const formB = createFormData({
      definition: {
        name: 'Test App',
        defaultPage: 'Test Page',
        path: 'a',
        pages: [
          {
            name: 'Test Page',
            blocks: [{ type: 'test', version: '0.0.0' }],
          },
        ],
      },
    });
    formB.append('coreStyle', '.foo { margin: 0 auto; }', {
      contentType: 'application/json',
      filename: 'style.json',
    });
    authorizeStudio();
    const responseB = await request.patch(`/api/apps/${app.id}`, formB);

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Provided CSS was invalid.",
        "statusCode": 400,
      }
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": "text/css",
            "instance": {
              "coreStyle": "",
              "definition": "{"name":"Test App","defaultPage":"Test Page","path":"a","pages":[{"name":"Test Page","blocks":[{"type":"test","version":"0.0.0"}]}]}",
            },
            "message": "has an invalid content type",
            "name": "contentType",
            "path": [
              "coreStyle",
            ],
            "property": "instance.coreStyle",
            "schema": {},
            "stack": "instance has an invalid content type",
          },
        ],
        "message": "Invalid content types found",
      }
    `);
  });

  it('should not allow invalid shared stylesheets when updating an app', async () => {
    const app = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const formA = createFormData({
      yaml: stripIndent(`
        name: Test App
        defaultPage: Test Page
        pages:
          - name: Test Page
            blocks:
              - type: testblock
      `),
      sharedStyle: 'this is invalid css',
    });
    authorizeStudio();
    const responseA = await request.patch(`/api/apps/${app.id}`, formA);

    const formB = createFormData({
      yaml: stripIndent(`
        name: Test App
        defaultPage: Test Page
        pages:
          - name: Test Page
            blocks:
              - type: testblock
      `),
      sharedStyle: '.foo { margin: 0 auto; }',
    });
    authorizeStudio();
    const responseB = await request.patch(`/api/apps/${app.id}`, formB);

    expect(responseA).toMatchSnapshot();
    expect(responseB).toMatchSnapshot();
  });

  it('should allow removing stylesheets when updating an app', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
      coreStyle: 'body { color: yellow; }',
      sharedStyle: 'body { color: blue; }',
    });

    authorizeStudio(user);
    const response = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({
        coreStyle: '',
        sharedStyle: '',
      }),
    );
    expect(response.status).toBe(200);
    await app.reload();
    expect(app.coreStyle).toBeNull();
    expect(app.sharedStyle).toBeNull();
  });

  it('should update the app demo mode flag', async () => {
    const app = await App.create(
      {
        path: 'bar',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    authorizeStudio();
    const response = await request.patch(`/api/apps/${app.id}`, createFormData({ demoMode: true }));

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "demoMode": true,
        "displayAppMemberName": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": "unlocked",
        "path": "bar",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);

    const response2 = await request.patch(
      `/api/apps/${app.id}`,
      createFormData({ demoMode: false }),
    );

    expect(response2).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "demoMode": false,
        "displayAppMemberName": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": "unlocked",
        "path": "bar",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
  });

  it('should update the app seed flag', async () => {
    const app = await App.create(
      {
        path: 'bar',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    expect(app.toJSON()).toMatchInlineSnapshot(`
      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": undefined,
        "controllerCode": null,
        "controllerImplementations": null,
        "coreStyle": undefined,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "demoMode": false,
        "displayAppMemberName": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasClonableAssets": undefined,
        "hasClonableResources": undefined,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": "unlocked",
        "messages": undefined,
        "path": "bar",
        "rating": undefined,
        "readmeUrl": undefined,
        "screenshotUrls": undefined,
        "sentryDsn": null,
        "sentryEnvironment": null,
        "sharedStyle": undefined,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);

    authorizeStudio();

    const response = await request.patch(`/api/apps/${app.id}`, createFormData({ demoMode: true }));

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "demoMode": true,
        "displayAppMemberName": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": "unlocked",
        "path": "bar",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);

    const response2 = await request.patch(`/api/apps/${app.id}`, createFormData({ seed: false }));

    expect(response2).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "$created": "1970-01-01T00:00:00.000Z",
        "$updated": "1970-01-01T00:00:00.000Z",
        "OrganizationId": "testorganization",
        "OrganizationName": "Test Organization",
        "controllerCode": null,
        "controllerImplementations": null,
        "definition": {
          "defaultPage": "Test Page",
          "name": "Test App",
        },
        "demoMode": true,
        "displayAppMemberName": false,
        "domain": null,
        "emailName": null,
        "enableSelfRegistration": true,
        "enableUnsecuredServiceSecrets": false,
        "googleAnalyticsID": null,
        "hasIcon": false,
        "hasMaskableIcon": false,
        "iconBackground": "#ffffff",
        "iconUrl": null,
        "id": 1,
        "locked": "unlocked",
        "path": "bar",
        "screenshotUrls": [],
        "sentryDsn": null,
        "sentryEnvironment": null,
        "showAppDefinition": false,
        "showAppsembleLogin": false,
        "showAppsembleOAuth2Login": true,
        "template": false,
        "visibility": "unlisted",
        "yaml": "name: Test App
      defaultPage: Test Page
      ",
      }
    `);
  });
});
