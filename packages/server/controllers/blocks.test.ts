import { createFixtureStream, readFixture } from '@appsemble/node-utils';
import { type BlockManifest } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';
import stripIndent from 'strip-indent';

import { BlockAsset, BlockMessages, BlockVersion, Member, Organization } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { authorizeClientCredentials, createTestUser } from '../utils/test/authorization.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

useTestDatabase(import.meta);

beforeEach(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  const user = await createTestUser();
  const organization = await Organization.create({
    id: 'xkcd',
    name: 'xkcd',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Maintainer' });
  await setTestApp(server);
});

describe('getBlock', () => {
  it('should be possible to retrieve a block definition', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/test');
    formData.append('description', 'foo');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });

    await authorizeClientCredentials('blocks:write');
    const { data: original } = await request.post('/api/blocks', formData);
    const { data: retrieved } = await request.get('/api/blocks/@xkcd/test');

    expect(retrieved).toStrictEqual(original);
  });

  it('should return a 404 if the requested block definition doesn’t exist', async () => {
    const { data } = await request.get('/api/blocks/@non/existent');
    expect(data).toStrictEqual({
      error: 'Not Found',
      message: 'Block definition not found',
      statusCode: 404,
    });
  });
});

describe('queryBlocks', () => {
  it('should be possible to query block definitions', async () => {
    const formDataA = new FormData();
    formDataA.append('name', '@xkcd/apple');
    formDataA.append('version', '0.0.0');
    formDataA.append('description', 'I’ve got an apple.');
    formDataA.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });

    await authorizeClientCredentials('blocks:write');
    await request.post<BlockManifest>('/api/blocks', formDataA);

    const formDataB = new FormData();
    formDataB.append('name', '@xkcd/pen');
    formDataB.append('version', '0.0.0');
    formDataB.append('description', 'I’ve got a pen.');
    formDataB.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });

    await authorizeClientCredentials('blocks:write');
    await request.post<BlockManifest>('/api/blocks', formDataB);

    const { data: bam } = await request.get<BlockManifest[]>('/api/blocks');
    expect(bam).toHaveLength(2);
    expect(bam).toMatchInlineSnapshot(`
      [
        {
          "actions": null,
          "description": "I’ve got a pen.",
          "events": null,
          "examples": [],
          "iconUrl": null,
          "layout": null,
          "longDescription": null,
          "name": "@xkcd/pen",
          "parameters": null,
          "version": "0.0.0",
          "wildcardActions": false,
        },
        {
          "actions": null,
          "description": "I’ve got an apple.",
          "events": null,
          "examples": [],
          "iconUrl": null,
          "layout": null,
          "longDescription": null,
          "name": "@xkcd/apple",
          "parameters": null,
          "version": "0.0.0",
          "wildcardActions": false,
        },
      ]
    `);
  });

  it('should not include unlisted blocks', async () => {
    await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test-2',
      version: '1.2.3',
      visibility: 'unlisted',
    });

    const { data: response } = await request.get<BlockManifest[]>('/api/blocks');
    expect(response).toHaveLength(1);
    expect(response).toMatchInlineSnapshot(`
      [
        {
          "actions": null,
          "description": null,
          "events": null,
          "examples": [],
          "iconUrl": null,
          "layout": null,
          "longDescription": null,
          "name": "@xkcd/test",
          "parameters": null,
          "version": "1.2.3",
          "wildcardActions": false,
        },
      ]
    `);
  });

  it('should include unlisted blocks for the organizations the user is a part of', async () => {
    await Organization.create({
      id: 'not-xkcd',
      name: 'not-xkcd',
    });
    await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test-2',
      version: '1.2.3',
      visibility: 'unlisted',
    });
    await BlockVersion.create({
      OrganizationId: 'not-xkcd',
      name: 'not-test',
      version: '1.2.3',
    });
    await BlockVersion.create({
      OrganizationId: 'not-xkcd',
      name: 'test-2',
      version: '1.2.3',
      visibility: 'unlisted',
    });

    const { data: response } = await request.get<BlockManifest[]>('/api/blocks');
    expect(response).toHaveLength(2);
    expect(response).toMatchInlineSnapshot(`
      [
        {
          "actions": null,
          "description": null,
          "events": null,
          "examples": [],
          "iconUrl": null,
          "layout": null,
          "longDescription": null,
          "name": "@xkcd/test",
          "parameters": null,
          "version": "1.2.3",
          "wildcardActions": false,
        },
        {
          "actions": null,
          "description": null,
          "events": null,
          "examples": [],
          "iconUrl": null,
          "layout": null,
          "longDescription": null,
          "name": "@not-xkcd/not-test",
          "parameters": null,
          "version": "1.2.3",
          "wildcardActions": false,
        },
      ]
    `);
  });
});

describe('publishBlock', () => {
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
                pattern: '^\\d+\\.\\d+\\.\\d+$',
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

describe('getBlockVersion', () => {
  it('should be possible to retrieve a block version', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });

    await authorizeClientCredentials('blocks:write');
    const { data: created } = await request.post<BlockManifest>('/api/blocks', formData);

    const {
      data: retrieved,
      headers,
      status,
    } = await request.get<BlockManifest>('/api/blocks/@xkcd/standing/versions/1.32.9');

    expect(retrieved.iconUrl).toBeNull();
    expect(retrieved).toStrictEqual(created);
    expect(status).toBe(200);
    expect(headers['cache-control']).toBe('max-age=31536000,immutable');
  });

  it('should use the block’s icon in the iconUrl if the block has one', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });
    formData.append('icon', createFixtureStream('nodejs-logo.png'), { filepath: 'icon.png' });

    await authorizeClientCredentials('blocks:write');
    const { data: created } = await request.post('/api/blocks', formData);
    const { data: retrieved, status } = await request.get<BlockManifest>(
      '/api/blocks/@xkcd/standing/versions/1.32.9',
    );

    expect(retrieved).toStrictEqual(created);
    expect(retrieved.iconUrl).toBe('/api/blocks/@xkcd/standing/versions/1.32.9/icon');
    expect(status).toBe(200);
  });

  it('should use the organization icon in the iconUrl if the block does not have one', async () => {
    vi.clearAllTimers();
    vi.setSystemTime(0);
    await Organization.update(
      { icon: await readFixture('nodejs-logo.png') },
      { where: { id: 'xkcd' } },
    );
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });

    await authorizeClientCredentials('blocks:write');
    const { data: created } = await request.post('/api/blocks', formData);

    const { data: retrieved, status } = await request.get<BlockManifest>(
      '/api/blocks/@xkcd/standing/versions/1.32.9',
    );

    expect(retrieved).toStrictEqual(created);
    expect(retrieved.iconUrl).toBe(
      '/api/organizations/xkcd/icon?updated=1970-01-01T00%3A00%3A00.000Z',
    );
    expect(status).toBe(200);
  });

  it('should respond with 404 when trying to fetch a non existing block version', async () => {
    const { data, status } = await request.get('/api/blocks/@xkcd/standing/versions/3.1.4');
    expect(status).toBe(404);
    expect(data).toStrictEqual({
      error: 'Not Found',
      message: 'Block version not found',
      statusCode: 404,
    });
  });
});

describe('getBlockVersions', () => {
  it('should be possible to fetch uploaded block versions', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('description', 'Version 1.32.9!');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });
    await authorizeClientCredentials('blocks:write');
    await request.post('/api/blocks', formData);

    const { data } = await request.get('/api/blocks/@xkcd/standing/versions');
    expect(data).toStrictEqual([
      {
        name: '@xkcd/standing',
        description: 'Version 1.32.9!',
        longDescription: null,
        actions: null,
        events: null,
        examples: [],
        files: ['standing.png', 'testblock.js'],
        iconUrl: null,
        languages: null,
        layout: null,
        parameters: null,
        version: '1.32.9',
        wildcardActions: false,
      },
    ]);
  });

  it('should not be possible to fetch block versions of non-existent blocks', async () => {
    const { data } = await request.get('/api/blocks/@xkcd/standing/versions');
    expect(data).toStrictEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Block not found.',
    });
  });

  it('should order block versions by most recent first', async () => {
    const formDataA = new FormData();
    formDataA.append('name', '@xkcd/standing');
    formDataA.append('description', 'Version 1.4.0!');
    formDataA.append('version', '1.4.0');
    formDataA.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });
    formDataA.append('messages', JSON.stringify({ en: { foo: 'Foo' } }));
    await authorizeClientCredentials('blocks:write');
    await request.post('/api/blocks', formDataA);

    const formDataB = new FormData();
    formDataB.append('name', '@xkcd/standing');
    formDataB.append('description', 'Version 1.32.9!');
    formDataB.append('version', '1.32.9');
    formDataB.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });
    await authorizeClientCredentials('blocks:write');
    await request.post('/api/blocks', formDataB);

    const { data } = await request.get('/api/blocks/@xkcd/standing/versions');
    expect(data).toStrictEqual([
      {
        name: '@xkcd/standing',
        description: 'Version 1.32.9!',
        longDescription: null,
        actions: null,
        events: null,
        examples: [],
        files: ['testblock.js'],
        iconUrl: null,
        languages: null,
        layout: null,
        parameters: null,
        version: '1.32.9',
        wildcardActions: false,
      },
      {
        name: '@xkcd/standing',
        description: 'Version 1.4.0!',
        longDescription: null,
        actions: null,
        events: null,
        examples: [],
        files: ['testblock.js'],
        iconUrl: null,
        languages: ['en'],
        layout: null,
        parameters: null,
        version: '1.4.0',
        wildcardActions: false,
      },
    ]);
  });
});

describe('getBlockAsset', () => {
  it('should serve a block asset', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockAsset.create({
      BlockVersionId: block.id,
      filename: 'hello.js',
      content: 'console.log("Hello world!")',
      mime: 'application/javascript',
    });

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.2.3/asset', {
      params: { filename: 'hello.js' },
    });
    expect(response.headers['content-type']).toBe('application/javascript; charset=utf-8');
    expect(response.data).toBe('console.log("Hello world!")');
  });

  it('should respond with 404 the version mismatches', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockAsset.create({
      BlockVersionId: block.id,
      filename: 'hello.js',
      content: 'console.log("Hello world!")',
      mime: 'application/javascript',
    });

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.2.4/asset', {
      params: { filename: 'hello.js' },
    });
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Block version not found',
        statusCode: 404,
      },
    });
  });

  it('should respond with 404 if the organization mismatches', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockAsset.create({
      BlockVersionId: block.id,
      filename: 'hello.js',
      content: 'console.log("Hello world!")',
      mime: 'application/javascript',
    });

    const response = await request.get('/api/blocks/@nope/test/versions/1.2.3/asset', {
      params: { filename: 'hello.js' },
    });
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Block version not found',
        statusCode: 404,
      },
    });
  });

  it('should respond with 404 if the block name mismatches', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockAsset.create({
      BlockVersionId: block.id,
      filename: 'hello.js',
      content: 'console.log("Hello world!")',
      mime: 'application/javascript',
    });

    const response = await request.get('/api/blocks/@xkcd/nope/versions/1.2.3/asset', {
      params: { filename: 'hello.js' },
    });
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Block version not found',
        statusCode: 404,
      },
    });
  });

  it('should respond with 404 no filename matches', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockAsset.create({
      BlockVersionId: block.id,
      filename: 'hello.js',
      content: 'console.log("Hello world!")',
      mime: 'application/javascript',
    });

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.2.3/asset', {
      params: { filename: 'nope.js' },
    });
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Block has no asset named "nope.js"',
        statusCode: 404,
      },
    });
  });
});

describe('getBlockMessages', () => {
  it('should download block messages', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockMessages.create({
      BlockVersionId: block.id,
      language: 'en',
      messages: { hello: 'Hello' },
    });

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.2.3/messages/en');
    expect(response).toMatchObject({
      status: 200,
      data: { hello: 'Hello' },
    });
  });

  it('should return 404 if the block messages don’t exist', async () => {
    await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.2.3/messages/en');
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Block has no messages for language "en"',
        statusCode: 404,
      },
    });
  });

  it('should return 404 if the block doesn’t exist', async () => {
    const response = await request.get('/api/blocks/@xkcd/test/versions/1.2.3/messages/en');
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Block version not found',
        statusCode: 404,
      },
    });
  });
});

describe('getBlockIcon', () => {
  it('should serve the block icon', async () => {
    const icon = await readFixture('testpattern.png');
    const formData = new FormData();
    formData.append('name', '@xkcd/test');
    formData.append('description', 'foo');
    formData.append('version', '1.33.8');
    formData.append('files', Buffer.from(''), 'test.js');
    formData.append('icon', icon);

    await authorizeClientCredentials('blocks:write');
    await request.post('/api/blocks', formData);

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.33.8/icon', {
      responseType: 'arraybuffer',
    });
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toMatchImageSnapshot();
  });

  it('should return a 404 if the requested block definition doesn’t exist', async () => {
    const { data } = await request.get('/api/blocks/@non/existent');
    expect(data).toStrictEqual({
      error: 'Not Found',
      message: 'Block definition not found',
      statusCode: 404,
    });
  });

  it('should return the default icon if no block icon was defined', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/test');
    formData.append('description', 'foo');
    formData.append('version', '1.33.8');
    formData.append('files', Buffer.from(''), 'test.js');

    await authorizeClientCredentials('blocks:write');
    await request.post('/api/blocks', formData);

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.33.8/icon', {
      responseType: 'arraybuffer',
    });

    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toMatchImageSnapshot();
  });
});
