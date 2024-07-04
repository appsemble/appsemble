import { type OpenAPIV3 } from 'openapi-types';

export const paths: OpenAPIV3.PathsObject = {
  '/api/apps/{appId}/members/{memberId}/picture': {
    parameters: [
      { $ref: '#/components/parameters/appId' },
      {
        name: 'memberId',
        in: 'path',
        description: 'The id of the member on which to perform the operation',
        required: true,
        schema: { $ref: '#/components/schemas/User/properties/id' },
      },
    ],
    get: {
      tags: ['common', 'app', 'member'],
      description: `Get an app member’s profile picture.

  This will return a 404 if the user has not uploaded one.`,
      operationId: 'getAppMemberPicture',
      responses: {
        200: {
          description: 'The profile picture of the app member.',
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
};
