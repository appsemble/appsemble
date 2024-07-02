import { type OpenAPIV3 } from 'openapi-types';

import { paths as assetsPaths } from './assets/index.js';
import { paths as membersPaths } from './members/index.js';
import { paths as messagesPaths } from './messages/index.js';
import { paths as resourcesPaths } from './resources/index.js';
import { paths as teamsPaths } from './teams/index.js';
import { paths as variablesPaths } from './variables/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...assetsPaths,
  ...membersPaths,
  ...messagesPaths,
  ...resourcesPaths,
  ...teamsPaths,
  ...variablesPaths,
  '/api/apps/{appId}/icon': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['main', 'app'],
      description: 'Get the current app icon.',
      operationId: 'getAppIcon',
      responses: {
        200: {
          description: 'The icon of the app that matches the given id.',
          content: {
            'image/png': {},
            'image/jpeg': {},
            'image/tiff': {},
            'image/webp': {},
          },
        },
      },
    },
  },
  '/api/apps/{appId}/style/core': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['common', 'app'],
      description: 'Get the core style for this app.',
      operationId: 'getAppCoreStyle',
      responses: {
        200: {
          description: 'The core stylesheet associated with this app.',
          content: {
            'text/css': {},
          },
        },
      },
    },
  },
  '/api/apps/{appId}/style/shared': {
    parameters: [{ $ref: '#/components/parameters/appId' }],
    get: {
      tags: ['common', 'app'],
      description: 'Get the shared style for this app.',
      operationId: 'getAppSharedStyle',
      responses: {
        200: {
          description: 'The shared stylesheet associated with this app.',
          content: {
            'text/css': {},
          },
        },
      },
    },
  },
  '/api/apps/{appId}/style/block/@{organizationId}/{blockId}': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      { $ref: '#/components/parameters/organizationId' },
      { $ref: '#/components/parameters/blockId' },
    ],
    get: {
      tags: ['common', 'app'],
      description: 'Get the app style for a block.',
      operationId: 'getAppBlockStyle',
      responses: {
        200: {
          description: 'The stylesheet associated with this block for this app.',
          content: {
            'text/css': {},
          },
        },
      },
    },
  },
};
