import { type OpenAPIV3 } from 'openapi-types';

import { paths as memberIdPaths } from './memberId/index.js';

export const paths: OpenAPIV3.PathsObject = {
  ...memberIdPaths,
  // '/api/apps/{appId}/members': {
  //   parameters: [
  //     { $ref: '#/components/parameters/appId' },
  //     { in: 'query', name: 'demo', description: 'Whether to fetch demo app members' },
  //   ],
  //   get: {
  //     tags: ['common', 'app', 'member'],
  //     description: 'Fetch all members of an app.',
  //     operationId: 'getAppMembers',
  //     responses: {
  //       200: {
  //         description: 'The list of app members.',
  //         content: {
  //           'application/json': {
  //             schema: {
  //               type: 'array',
  //               items: {
  //                 $ref: '#/components/schemas/OrganizationMember',
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //     security: [{ studio: [] }, { app: ['openid'] }],
  //   },
  // },
};
