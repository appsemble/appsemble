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
    const blockVersionMessages = (await BlockVersion.findOne({
      where: { version: '1.32.9', OrganizationId: 'xkcd', name: 'standing' },
      include: [BlockMessages],
    }))!;

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
      data: { message: 'Action “$foo” does not match /^[a-z]\\w*$/' },
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
            properties: expect.any(Object),
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
