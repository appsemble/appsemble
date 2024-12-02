import { createFixtureStream } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';
import stripIndent from 'strip-indent';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  BlockMessages,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeClientCredentials, createTestUser } from '../../../utils/test/authorization.js';

let user: User;

describe('createBlock', () => {
  beforeEach(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    user = await createTestUser();
    const organization = await Organization.create({
      id: 'xkcd',
      name: 'xkcd',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: 'Maintainer',
    });
    await setTestApp(server);
  });

  it('should be possible to upload encoded file paths', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filename: encodeURIComponent('build/standing.png'),
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: encodeURIComponent('build/testblock.js'),
    });

    await authorizeClientCredentials('blocks:write');
    const { data, status } = await request.post('/api/blocks', formData);

    expect(data).toStrictEqual({
      actions: null,
      events: null,
      examples: [],
      files: ['build/standing.png', 'build/testblock.js'],
      name: '@xkcd/standing',
      iconUrl: null,
      languages: null,
      layout: null,
      parameters: null,
      version: '1.32.9',
      description: null,
      longDescription: null,
      wildcardActions: false,
    });

    expect(status).toBe(201);
  });

  it('should accept messages when publishing blocks', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filename: encodeURIComponent('build/standing.png'),
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: encodeURIComponent('build/testblock.js'),
    });
    formData.append(
      'messages',
      JSON.stringify({
        en: { test: 'foo' },
        nl: { test: 'bar' },
      }),
    );

    await authorizeClientCredentials('blocks:write');
    const { status } = await request.post('/api/blocks', formData);
    const blockVersionMessages = await BlockVersion.findOne({
      where: { version: '1.32.9', OrganizationId: 'xkcd', name: 'standing' },
      include: [BlockMessages],
    });

    expect(status).toBe(201);
    expect(blockVersionMessages.BlockMessages).toMatchObject([
      {
        language: 'en',
        messages: { test: 'foo' },
      },
      {
        language: 'nl',
        messages: { test: 'bar' },
      },
    ]);
  });

  it('should not accept messages when publishing blocks if english is excluded', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filename: encodeURIComponent('build/standing.png'),
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: encodeURIComponent('build/testblock.js'),
    });
    formData.append(
      'messages',
      JSON.stringify({
        nl: { test: 'bar' },
      }),
    );

    await authorizeClientCredentials('blocks:write');
    const response = await request.post('/api/blocks', formData);

    expect(response).toMatchObject({
      status: 400,
      data: {
        errors: [
          {
            argument: 'en',
            instance: {
              nl: {
                test: 'bar',
              },
            },
            message: 'requires property "en"',
            name: 'required',
            path: ['messages'],
            property: 'instance.messages',
            schema: {
              additionalProperties: {
                additionalProperties: {
                  description: 'The translated messages for this language.',
                  type: 'string',
                },
                type: 'object',
              },
              description: `The translated messages for the block.

English (\`en\`) messages are required.
`,
              properties: {
                en: {
                  additionalProperties: {
                    description: 'The default translations to use.',
                    minLength: 1,
                    type: 'string',
                  },
                  type: 'object',
                },
              },
              required: ['en'],
              type: 'object',
            },
            stack: 'instance.messages requires property "en"',
          },
        ],
        message: 'Invalid content types found',
      },
    });
  });

  it('should not accept messages when publishing blocks if english has empty values', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filename: encodeURIComponent('build/standing.png'),
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: encodeURIComponent('build/testblock.js'),
    });
    formData.append(
      'messages',
      JSON.stringify({
        en: { test: '' },
      }),
    );

    await authorizeClientCredentials('blocks:write');
    const response = await request.post('/api/blocks', formData);

    expect(response).toMatchObject({
      status: 400,
      data: {
        errors: [
          {
            argument: 1,
            instance: '',
            message: 'does not meet minimum length of 1',
            name: 'minLength',
            path: ['messages', 'en', 'test'],
            property: 'instance.messages.en.test',
            schema: {
              description: 'The default translations to use.',
              minLength: 1,
              type: 'string',
            },
            stack: 'instance.messages.en.test does not meet minimum length of 1',
          },
        ],
        message: 'Invalid content types found',
      },
    });
  });

  it('should check for mismatching keys in messages when publishing blocks', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filename: encodeURIComponent('build/standing.png'),
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: encodeURIComponent('build/testblock.js'),
    });
    formData.append(
      'messages',
      JSON.stringify({
        en: { test: 'foo', baz: '123' },
        nl: { test: 'bar' },
      }),
    );

    await authorizeClientCredentials('blocks:write');
    const response = await request.post('/api/blocks', formData);

    expect(response).toMatchObject({
      status: 400,
      data: { message: 'Language ‘nl’ contains mismatched keys compared to ‘en’.' },
    });
  });

  it('should not accept invalid action names', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('actions', JSON.stringify({ $any: {}, $foo: {} }));
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });
    await authorizeClientCredentials('blocks:write');
    const response = await request.post('/api/blocks', formData);

    expect(response).toMatchObject({
      status: 400,
      data: { message: 'Action “$foo” does match /^[a-z]\\w*$/' },
    });
  });

  it('should not be possible to register the same block version twice', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('description', 'This block has been uploaded for the purpose of unit testing.');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });

    await authorizeClientCredentials('blocks:write');
    await request.post('/api/blocks', formData);

    const formData2 = new FormData();
    formData2.append('name', '@xkcd/standing');
    formData2.append(
      'description',
      'This block has been uploaded for the purpose of unit testing.',
    );
    formData2.append('version', '1.32.9');
    formData2.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData2.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });

    await authorizeClientCredentials('blocks:write');
    const { data } = await request.post('/api/blocks', formData2);

    expect(data).toStrictEqual({
      error: 'Conflict',
      message:
        'Version 1.32.9 is equal to or lower than the already existing @xkcd/standing@1.32.9.',
      statusCode: 409,
    });
  });

  it('should require at least one file', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');

    await authorizeClientCredentials('blocks:write');
    const { data, status } = await request.post('/api/blocks', formData);

    expect(data).toStrictEqual({
      errors: [
        {
          argument: 'files',
          instance: {
            name: '@xkcd/standing',
            version: '1.32.9',
          },
          message: 'requires property "files"',
          name: 'required',
          path: [],
          property: 'instance',
          schema: {
            additionalProperties: false,
            description: `A version of a block definition

Block versions can’t be updated or deleted. This ensures apps that use a block version can never
be broken by alterations of block definitions.
`,
            properties: {
              actions: {
                additionalProperties: true,
                description: `An object which describes the actions a block can trigger.

This will be used to validate app definitions.
`,
                type: 'object',
              },
              description: {
                description: 'The description of the block.',
                maxLength: 160,
                type: 'string',
              },
              events: {
                additionalProperties: false,
                description:
                  'An object describing the names of the events the block can listen and emit to.',
                properties: {
                  emit: {
                    additionalProperties: {
                      additionalProperties: false,
                      description: 'A mapping of events this block may emit',
                      properties: {
                        description: {
                          type: 'string',
                        },
                      },
                      type: 'object',
                    },
                    description: 'A mapping of events this block may emit',
                    type: 'object',
                  },
                  listen: {
                    additionalProperties: {
                      additionalProperties: false,
                      description: 'A mapping of events this block may listen on',
                      properties: {
                        description: {
                          type: 'string',
                        },
                      },
                      type: 'object',
                    },
                    description: 'A mapping of events this block may listen on',
                    type: 'object',
                  },
                },
                type: 'object',
              },
              examples: {
                description:
                  'A list of exmples how the block can be used within an app definition.',
                items: {
                  type: 'string',
                },
                type: 'array',
              },
              files: {
                description: 'A list of file assets that belong to the app version.',
                items: {
                  format: 'binary',
                  type: 'string',
                },
                minLength: 1,
                type: 'array',
              },
              icon: {
                description: 'An icon to represent the block in Appsemble studio.',
                format: 'binary',
                type: 'string',
              },
              iconUrl: {
                description: 'The relative URL on which the icon is served',
                format: 'uri',
                readOnly: true,
                type: 'string',
              },
              layout: {
                default: 'grow',
                description: `How the block will be displayed on the screen.

- **\`float\`**: The block will float somewhere on the screen.
- **\`grow\`**: The block will be positioned in the main page. It will grow to fill up remaining
  space on the page.
- **\`static\`**: The block will be positioned in the main page. It will take up a fixed amount of
  space.
- **\`hidden\`**: The block will not be rendered at all.
`,
                enum: ['float', 'grow', 'static', 'hidden'],
              },
              longDescription: {
                description: 'The long description of the block.',
                type: 'string',
              },
              messages: {
                additionalProperties: {
                  additionalProperties: {
                    description: 'The translated messages for this language.',
                    type: 'string',
                  },
                  description: 'A mapping of language IDs to their internationalized translation',
                  type: 'object',
                },
                description: `The translated messages for the block.

English (\`en\`) messages are required.
`,
                properties: {
                  en: {
                    additionalProperties: {
                      description: 'The default translations to use.',
                      minLength: 1,
                      type: 'string',
                    },
                    description: 'A mapping of language IDs to their English translation',
                    type: 'object',
                  },
                },
                required: ['en'],
                type: 'object',
              },
              name: {
                description: `The name of a block.

This uses the same form as scoped npm packages. For example, \`@appsemble/form\`.
`,
                pattern:
                  '^@([\\da-z](?:(?!.*--)[\\da-z-]*[\\da-z])?)/([\\da-z](?:(?!.*--)[\\da-z-]*[\\da-z])?)$',
                readOnly: true,
                type: 'string',
              },
              parameters: {
                $ref: '#/components/schemas/JSONSchemaRoot',
                description: `A draft 7 JSON schema to use for block parameter validation.

If the parameters of a block definition don’t conform to this schema, the app definition will be
considered invalid.
`,
              },
              resources: {
                additionalProperties: true,
                description: 'deprecated',
                type: 'object',
              },
              version: {
                description: 'A [semver](https://semver.org) representation of the block version.',
                pattern: '^\\d+\\.\\d+\\.\\d+(-[\\d.a-z-]+)?$',
                type: 'string',
              },
              visibility: {
                default: 'public',
                description: `Whether the block should be listed publicly for users who aren’t part of the block’s organization.

- **\`public\`**: The block is visible for everyone.
- **\`unlisted\`**: The block will only be visible if the user is logged in and is part of the block’s organization.`,
                enum: ['public', 'unlisted'],
              },
            },
            required: ['name', 'version', 'files'],
            type: 'object',
          },
          stack: 'instance requires property "files"',
        },
      ],
      message: 'Invalid content types found',
    });
    expect(status).toBe(400);
  });

  it('should allow block examples', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.2.3');
    formData.append('files', createFixtureStream('standing.png'));
    formData.append('events', JSON.stringify({ listen: { foo: {} }, emit: { bar: {} } }));
    formData.append('actions', JSON.stringify({ onSubmit: {} }));
    formData.append(
      'parameters',
      JSON.stringify({
        type: 'object',
        additionalProperties: false,
        properties: { hello: { type: 'string' } },
      }),
    );
    formData.append(
      'examples',
      stripIndent(`
        parameters:
          hello: world
        actions:
          onSubmit:
            type: noop
        events:
          listen:
            foo: ok
          emit:
            bar: ok
      `),
    );

    await authorizeClientCredentials('blocks:write');
    const response = await request.post('/api/blocks', formData);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "actions": {
          "onSubmit": {},
        },
        "description": null,
        "events": {
          "emit": {
            "bar": {},
          },
          "listen": {
            "foo": {},
          },
        },
        "examples": [
          "
      parameters:
        hello: world
      actions:
        onSubmit:
          type: noop
      events:
        listen:
          foo: ok
        emit:
          bar: ok
            ",
        ],
        "files": [
          "standing.png",
        ],
        "iconUrl": null,
        "languages": null,
        "layout": null,
        "longDescription": null,
        "name": "@xkcd/standing",
        "parameters": {
          "additionalProperties": false,
          "properties": {
            "hello": {
              "type": "string",
            },
          },
          "type": "object",
        },
        "version": "1.2.3",
        "wildcardActions": false,
      }
    `);
  });

  it('should validate block examples', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.2.3');
    formData.append('files', createFixtureStream('standing.png'));
    formData.append('events', JSON.stringify({ listen: { foo: {} }, emit: { bar: {} } }));
    formData.append('actions', JSON.stringify({ onSubmit: {} }));
    formData.append(
      'parameters',
      JSON.stringify({
        type: 'object',
        additionalProperties: false,
        properties: {},
      }),
    );
    formData.append(
      'examples',
      stripIndent(`
        parameters:
          additional: forbidden
        actions:
          onSubmit:
            type: invalid
        events:
          listen:
            fooz: invalid
          emit:
            baz: invalid
      `),
    );

    await authorizeClientCredentials('blocks:write');
    const response = await request.post('/api/blocks', formData);

    expect(response).toMatchSnapshot();
  });
});
