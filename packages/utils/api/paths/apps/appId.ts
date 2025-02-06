import { type OpenAPIV3 } from 'openapi-types';

import { hexColor } from '../../../constants/index.js';

export const pathItems: OpenAPIV3.PathItemObject = {
  parameters: [{ $ref: '#/components/parameters/appId' }],
  get: {
    tags: ['main', 'app'],
    parameters: [
      {
        name: 'language',
        schema: { type: 'string' },
        description: 'The language to include the translations of, if available',
        in: 'query',
      },
    ],
    description: 'Get a single app',
    operationId: 'getAppById',
    responses: {
      200: {
        description: 'The app that matches the given id.',
        $ref: '#/components/responses/app',
      },
    },
    security: [{ studio: [] }, {}],
  },
  patch: {
    tags: ['main', 'app'],
    description: 'Update parts of an existing app',
    operationId: 'patchApp',
    requestBody: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              domain: {
                $ref: '#/components/schemas/App/properties/domain',
              },
              path: {
                $ref: '#/components/schemas/App/properties/path',
              },
              visibility: {
                $ref: '#/components/schemas/App/properties/visibility',
              },
              template: {
                $ref: '#/components/schemas/App/properties/template',
              },
              demoMode: {
                $ref: '#/components/schemas/App/properties/demoMode',
              },
              force: {
                type: 'boolean',
                description: 'Whether the locked property should be ignored.',
              },
              yaml: {
                type: 'string',
                description: 'The original YAML definition used to define the app.',
              },
              icon: {
                type: 'string',
                format: 'binary',
                description: 'The app icon.',
              },
              maskableIcon: {
                type: 'string',
                format: 'binary',
                description: 'The app icon.',
              },
              iconBackground: {
                type: 'string',
                pattern: hexColor.source,
              },
              coreStyle: {
                type: 'string',
                description: 'The custom style to apply to the core app.',
              },
              sharedStyle: {
                type: 'string',
                description: 'The custom style to apply to all parts of app.',
              },
              screenshots: {
                type: 'array',
                description: 'Screenshots to showcase in the store',
                items: {
                  type: 'string',
                  format: 'binary',
                },
              },
              readmes: {
                type: 'array',
                description: 'Readmes to showcase in the store',
                items: {
                  type: 'string',
                  format: 'binary',
                },
              },
              controllerCode: {
                type: 'string',
                description: 'Custom app logic as a JavaScript string',
              },
              controllerImplementations: {
                type: 'string',
                description: 'Appsemble SDK interfaces implementations',
              },
              showAppsembleLogin: {
                type: 'boolean',
                description: 'Whether the Appsemble login method should be shown.',
              },
              showAppsembleOAuth2Login: {
                type: 'boolean',
                description: 'Whether the Appsemble OAuth2 login method should be shown.',
              },
              enableSelfRegistration: {
                type: 'boolean',
                description: 'Whether new users should be able to register themselves.',
              },
              displayAppMemberName: {
                $ref: '#/components/schemas/App/properties/displayAppMemberName',
              },
              emailName: {
                type: 'string',
                description: 'The name used for emails.',
              },
              emailHost: {
                type: 'string',
                description: 'The hostname of the SMTP server.',
              },
              emailPassword: {
                type: 'string',
                description:
                  'The password to use for SMTP authentication. This gets encrypted when stored.',
              },
              emailUser: {
                type: 'string',
                description: 'The username used to authenticate against the SMTP server.',
              },
              emailPort: {
                type: 'string',
                description: 'The port used for the SMTP server.',
              },
              emailSecure: {
                type: 'boolean',
                description: 'Whether TLS is being used.',
              },
              containers: {
                type: 'array',
                items: { $ref: '#/components/schemas/ContainerDefinition' },
              },
            },
          },
          encoding: {
            coreStyle: { contentType: 'text/css' },
            sharedStyle: { contentType: 'text/css' },
            icon: {
              contentType: 'image/png,image/jpeg,image/tiff,image/webp',
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'The updated app.',
        $ref: '#/components/responses/app',
      },
    },
    security: [{ studio: [] }, { cli: ['apps:write'] }],
  },
  delete: {
    tags: ['main', 'app'],
    description: 'Delete an existing app',
    operationId: 'deleteApp',
    responses: {
      204: {
        description: 'The app was successfully deleted.',
      },
    },
    security: [{ studio: [] }, { cli: ['apps:delete'] }],
  },
};
