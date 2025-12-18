import { ValidationError } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import {
  type AppDefinition,
  type BasicPageDefinition,
  type CustomAppGuestPermission,
  type CustomAppPermission,
  type FlowPageDefinition,
  predefinedAppRoles,
  type Security,
  type PageLayoutDefinition,
} from './types/index.js';
import { validateAppDefinition } from './validation.js';

function createTestApp(): AppDefinition {
  return {
    name: 'Test app',
    defaultPage: 'Test Page',
    security: {
      default: { role: 'User' },
      roles: { User: {} },
    },
    resources: {
      person: {
        update: {},
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
    },
    pages: [
      {
        name: 'Test Page',
        blocks: [],
      },
      {
        name: 'Page with parameters',
        parameters: [],
        blocks: [],
      },
      {
        name: 'Page with tabs',
        type: 'tabs',
        tabs: [{ name: 'Tab A', blocks: [] }],
      },
      {
        name: 'Page with steps',
        type: 'flow',
        steps: [
          { name: 'Step A', blocks: [] },
          { name: 'Step B', blocks: [] },
        ],
      },
      {
        name: 'Container Page 1',
        type: 'container',
        pages: [
          {
            name: 'Contained Page',
            blocks: [],
          },
        ],
      },
    ],
  };
}

describe('validateAppDefinition', () => {
  it('should report unknown block types', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
    });
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is not a known block type', 'test', undefined, [
        'pages',
        0,
        'blocks',
        0,
        'type',
      ]),
    ]);
  });

  it('should report unknown block versions', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
    });
    const result = await validateAppDefinition(app, () => [
      { name: '@appsemble/test', version: '0.0.0', files: [], languages: [] },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is not a known version for this block type', '1.2.3', undefined, [
        'pages',
        0,
        'blocks',
        0,
        'version',
      ]),
    ]);
  });

  it('should report duplicate page names', async () => {
    const app = createTestApp();
    app.pages.push({
      name: 'Container Page',
      type: 'container',
      pages: [{ name: 'Test Page', blocks: [] }],
    });
    const result = await validateAppDefinition(app, () => [
      { name: '@appsemble/test', version: '0.0.0', files: [], languages: [] },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is a duplicate page name', 'Test Page', undefined, [
        'Container Page',
        'Test Page',
      ]),
    ]);
  });

  it('should validate block parameters', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      parameters: {},
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        parameters: {
          type: 'object',
          required: ['foo'],
          properties: { foo: { type: 'string' } },
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('requires property "foo"', {}, undefined, [
        'pages',
        0,
        'blocks',
        0,
        'parameters',
      ]),
    ]);
  });

  it('should validate missing block parameters', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        parameters: {
          type: 'object',
          required: ['foo'],
          properties: { foo: { type: 'string' } },
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'requires property "parameters"',
        { type: 'test', version: '1.2.3' },
        undefined,
        ['pages', 0, 'blocks', 0],
      ),
    ]);
  });

  it('should validate block parameters using the action format', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      parameters: {
        foo: 'invalid',
        bar: 'onClick',
      },
      actions: {
        onClick: { type: 'noop' },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        parameters: {
          type: 'object',
          properties: {
            foo: { type: 'string', format: 'action' },
            bar: { type: 'string', format: 'action' },
          },
        },
        actions: {
          onClick: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not conform to the "action" format', 'invalid', undefined, [
        'pages',
        0,
        'blocks',
        0,
        'parameters',
        'foo',
      ]),
    ]);
  });

  it('should validate block parameters using the event-emitter format', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      parameters: {
        foo: 'invalid',
        bar: 'myEvent',
      },
      events: {
        emit: { myEvent: 'handleEvent' },
        listen: { myEvent: 'handleEvent' },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        parameters: {
          type: 'object',
          properties: {
            foo: { type: 'string', format: 'event-emitter' },
            bar: { type: 'string', format: 'event-emitter' },
          },
        },
        events: {
          emit: { myEvent: {} },
          listen: { myEvent: {} },
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not conform to the "event-emitter" format', 'invalid', undefined, [
        'pages',
        0,
        'blocks',
        0,
        'parameters',
        'foo',
      ]),
    ]);
  });

  it('should validate block parameters using the event-listener format', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      parameters: {
        foo: 'invalid',
        bar: 'myEvent',
      },
      events: {
        emit: { myEvent: 'handleEvent' },
        listen: { myEvent: 'handleEvent' },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        parameters: {
          type: 'object',
          properties: {
            foo: { type: 'string', format: 'event-listener' },
            bar: { type: 'string', format: 'event-listener' },
          },
        },
        events: {
          emit: { myEvent: {} },
          listen: { myEvent: {} },
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not conform to the "event-listener" format', 'invalid', undefined, [
        'pages',
        0,
        'blocks',
        0,
        'parameters',
        'foo',
      ]),
    ]);
  });

  it('should not allow block parameters if the block manifest doesn’t specify them', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      parameters: {},
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is not allowed on this block type', {}, undefined, [
        'pages',
        0,
        'blocks',
        0,
        'parameters',
      ]),
    ]);
  });

  it('should validate block actions', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onClick: { type: 'noop' },
        onSubmit: { type: 'noop' },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onClick: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is an unknown action for this block', { type: 'noop' }, undefined, [
        'pages',
        0,
        'blocks',
        0,
        'actions',
        'onSubmit',
      ]),
    ]);
  });

  it('should validate controller actions', async () => {
    const app = createTestApp();
    app.controller = {
      actions: {
        onClick: { type: 'noop' },
        onSubmit: { type: 'noop' },
      },
    };
    const result = await validateAppDefinition(app, () => [], {
      actions: {
        onClick: {},
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is an unknown action for this controller', { type: 'noop' }, undefined, [
        'controller',
        'actions',
        'onSubmit',
      ]),
    ]);
  });

  it('should report if a block doesn’t support actions', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {},
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is not allowed on this block', {}, undefined, [
        'pages',
        0,
        'blocks',
        0,
        'actions',
      ]),
    ]);
  });

  it('should report if a controller doesn’t support actions', async () => {
    const app = createTestApp();
    app.controller = {
      actions: {},
    };
    const result = await validateAppDefinition(app, () => [], {});
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is not allowed on this controller', {}, undefined, [
        'controller',
        'actions',
      ]),
    ]);
  });

  it('should report unused block actions based on parameters', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        foo: { type: 'noop' },
        bar: { type: 'noop' },
      },
      parameters: {
        onClick: 'foo',
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          $any: {},
        },
        parameters: {
          type: 'object',
          properties: {
            onClick: {
              type: 'string',
              format: 'action',
            },
          },
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is unused', { type: 'noop' }, undefined, [
        'pages',
        0,
        'blocks',
        0,
        'actions',
        'bar',
      ]),
    ]);
  });

  it('should allow wildcard actions on blocks', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        foo: { type: 'noop' },
        bar: { type: 'noop' },
      },
      parameters: {
        onClick: 'foo',
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        wildcardActions: true,
        actions: {
          $any: {},
        },
        parameters: {
          type: 'object',
          properties: {
            onClick: {
              type: 'string',
              format: 'action',
            },
          },
        },
      },
    ]);
    expect(result.valid).toBe(true);
  });

  it('should report unknown event emitters on blocks', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      events: {
        emit: {
          foo: 'bar',
        },
        listen: {
          foo: 'bar',
        },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        wildcardActions: true,
        events: {
          emit: {},
          listen: { $any: {} },
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is an unknown event emitter', 'bar', undefined, [
        'pages',
        0,
        'blocks',
        0,
        'events',
        'emit',
        'foo',
      ]),
    ]);
  });

  it('should report unknown event emitters on controller', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      events: {
        listen: {
          foo: 'bar',
        },
      },
    });
    app.controller = {
      events: {
        emit: {
          foo: 'bar',
        },
      },
    };
    const result = await validateAppDefinition(
      app,
      () => [
        {
          name: '@appsemble/test',
          version: '1.2.3',
          files: [],
          languages: [],
          wildcardActions: true,
          events: {
            listen: { foo: {} },
          },
        },
      ],
      {
        events: {
          emit: {},
        },
      },
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is an unknown event emitter', 'bar', undefined, [
        'controller',
        'events',
        'emit',
        'foo',
      ]),
    ]);
  });

  it('should allow $any matching unknown event emitters on blocks', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      events: {
        emit: {
          foo: 'bar',
        },
        listen: {
          foo: 'bar',
        },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        wildcardActions: true,
        events: {
          emit: { $any: {} },
          listen: { $any: {} },
        },
      },
    ]);
    expect(result.valid).toBe(true);
  });

  it('should report unknown event listeners on blocks', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      events: {
        listen: {
          foo: 'bar',
        },
        emit: {
          foo: 'bar',
        },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        wildcardActions: true,
        events: {
          listen: {},
          emit: { $any: {} },
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is an unknown event listener', 'bar', undefined, [
        'pages',
        0,
        'blocks',
        0,
        'events',
        'listen',
        'foo',
      ]),
    ]);
  });

  it('should report unknown event listeners on controller', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      events: {
        emit: {
          foo: 'bar',
        },
      },
    });
    app.controller = {
      events: {
        listen: {
          foo: 'bar',
        },
      },
    };
    const result = await validateAppDefinition(
      app,
      () => [
        {
          name: '@appsemble/test',
          version: '1.2.3',
          files: [],
          languages: [],
          wildcardActions: true,
          events: {
            emit: { foo: {} },
          },
        },
      ],
      {
        events: {
          listen: {},
        },
      },
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is an unknown event listener', 'bar', undefined, [
        'controller',
        'events',
        'listen',
        'foo',
      ]),
    ]);
  });

  it('should allow $any matching unknown event listener', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      events: {
        emit: {
          foo: 'bar',
        },
        listen: {
          foo: 'bar',
        },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        wildcardActions: true,
        events: {
          emit: { foo: {} },
          listen: { $any: {} },
        },
      },
    ]);
    expect(result.valid).toBe(true);
  });

  it('should report unmatched event listeners when there is no controller present', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      events: {
        listen: {
          foo: 'bar',
        },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        wildcardActions: true,
        events: {
          listen: { $any: {} },
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not match any event emitters', 'bar', undefined, [
        'pages',
        0,
        'blocks',
        0,
        'events',
        'listen',
        'foo',
      ]),
    ]);
  });

  it('should report unmatched event emitters when there is no controller present', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      events: {
        emit: {
          foo: 'bar',
        },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        wildcardActions: true,
        events: {
          emit: { $any: {} },
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not match any event listeners', 'bar', undefined, [
        'pages',
        0,
        'blocks',
        0,
        'events',
        'emit',
        'foo',
      ]),
    ]);
  });

  it('should report unmatched event from event actions when there is no controller present', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onClick: {
          type: 'event',
          event: 'sent',
          waitFor: 'reply',
        },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        wildcardActions: true,
        actions: {
          onClick: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not match any event emitters', 'reply', undefined, [
        'pages',
        0,
        'blocks',
        0,
        'actions',
        'onClick',
        'waitFor',
      ]),
      new ValidationError('does not match any event listeners', 'sent', undefined, [
        'pages',
        0,
        'blocks',
        0,
        'actions',
        'onClick',
        'event',
      ]),
    ]);
  });

  it('should not crash if security is undefined', async () => {
    const app = createTestApp();
    delete app.security;
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(true);
  });

  it('should not crash if controller is undefined', async () => {
    const app = createTestApp();
    app.controller = undefined;
    const result = await validateAppDefinition(app, () => [], {});
    expect(result.valid).toBe(true);
  });

  it('should report if notifications is "login" without a security definition', async () => {
    const app = createTestApp();
    delete app.security;
    app.notifications = 'login';
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('only works if security is defined', 'login', undefined, [
        'notifications',
      ]),
    ]);
  });

  it('should validate the default role exists', async () => {
    const app = createTestApp();
    app.security!.default!.role = 'Unknown';
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not exist in this app’s roles', 'Unknown', undefined, [
        'security',
        'default',
        'role',
      ]),
    ]);
  });

  it('should validate resource types against reserved keywords', async () => {
    const app = {
      name: 'Test app',
      defaultPage: 'Test Page',
      pages: [
        {
          name: 'Test Page',
          blocks: [],
        },
      ],
      resources: {
        created: {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
        updated: {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
        author: {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
        editor: {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
        seed: {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
        ephemeral: {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
        clonable: {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
        expires: {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      },
    } as AppDefinition;
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'is a reserved keyword',
        { type: 'object', properties: { name: { type: 'string' } } },
        undefined,
        ['resources', 'created'],
      ),
      new ValidationError(
        'is a reserved keyword',
        { type: 'object', properties: { name: { type: 'string' } } },
        undefined,
        ['resources', 'updated'],
      ),
      new ValidationError(
        'is a reserved keyword',
        { type: 'object', properties: { name: { type: 'string' } } },
        undefined,
        ['resources', 'author'],
      ),
      new ValidationError(
        'is a reserved keyword',
        { type: 'object', properties: { name: { type: 'string' } } },
        undefined,
        ['resources', 'editor'],
      ),
      new ValidationError(
        'is a reserved keyword',
        { type: 'object', properties: { name: { type: 'string' } } },
        undefined,
        ['resources', 'seed'],
      ),
      new ValidationError(
        'is a reserved keyword',
        { type: 'object', properties: { name: { type: 'string' } } },
        undefined,
        ['resources', 'ephemeral'],
      ),
      new ValidationError(
        'is a reserved keyword',
        { type: 'object', properties: { name: { type: 'string' } } },
        undefined,
        ['resources', 'clonable'],
      ),
      new ValidationError(
        'is a reserved keyword',
        { type: 'object', properties: { name: { type: 'string' } } },
        undefined,
        ['resources', 'expires'],
      ),
    ]);
  });

  it('should validate app member properties for type or enum', async () => {
    const app = { ...createTestApp(), members: { properties: { foo: { schema: {} } } } };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('must define type or enum', {}, undefined, [
        'members',
        'properties',
        'foo',
        'schema',
      ]),
    ]);
  });

  it('should validate member phone number definition', async () => {
    const phoneNumber = { enable: false, required: true };
    const app = { ...createTestApp(), members: { phoneNumber } };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('phone number should be enabled', phoneNumber, undefined, [
        'members',
        'phoneNumber',
        'required',
      ]),
    ]);
  });

  it('should validate app member properties for resource references', async () => {
    const app = {
      ...createTestApp(),
      members: {
        properties: {
          foo: {
            schema: { type: 'integer' },
            reference: {
              resource: 'tasks',
            },
          },
        },
      },
    } as AppDefinition;
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('refers to a resource that doesn’t exist', 'tasks', undefined, [
        'members',
        'properties',
        'foo',
        'reference',
        'tasks',
      ]),
    ]);
  });

  it('should validate resources use schemas define a type', async () => {
    const app = createTestApp();
    app.resources!.person.schema = { properties: {} };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('must define type object', { properties: {} }, undefined, [
        'resources',
        'person',
        'schema',
      ]),
    ]);
  });

  it('should validate resources use schemas define a type of object', async () => {
    const app = createTestApp();
    app.resources!.person.schema = { type: 'string', properties: {} };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('must define type object', 'string', undefined, [
        'resources',
        'person',
        'schema',
        'type',
      ]),
    ]);
  });

  it('should validate the resource id schema is correct', async () => {
    const app = createTestApp();
    app.resources!.person.schema = {
      type: 'object',
      properties: { id: { type: 'string', description: '', title: '', format: 'email' } },
    };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('must be integer', 'string', undefined, [
        'resources',
        'person',
        'schema',
        'properties',
        'id',
        'type',
      ]),
      new ValidationError('does not support custom validators', 'email', undefined, [
        'resources',
        'person',
        'schema',
        'properties',
        'id',
        'format',
      ]),
    ]);
  });

  it('should validate the resource $created and $updated schemas are correct', async () => {
    const app = createTestApp();
    app.resources!.person.schema = {
      type: 'object',
      properties: {
        $created: { type: 'number', description: '', title: '', format: 'email' },
        $updated: { type: 'boolean', description: '', title: '', format: 'uuid' },
      },
    };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('must be string', 'number', undefined, [
        'resources',
        'person',
        'schema',
        'properties',
        '$created',
        'type',
      ]),
      new ValidationError('must be date-time', 'email', undefined, [
        'resources',
        'person',
        'schema',
        'properties',
        '$created',
        'format',
      ]),
      new ValidationError('must be string', 'boolean', undefined, [
        'resources',
        'person',
        'schema',
        'properties',
        '$updated',
        'type',
      ]),
      new ValidationError('must be date-time', 'uuid', undefined, [
        'resources',
        'person',
        'schema',
        'properties',
        '$updated',
        'format',
      ]),
    ]);
  });

  it('should report resource properties starting with $', async () => {
    const app = createTestApp();
    app.resources!.person.schema = {
      type: 'object',
      properties: { $invalid: { type: 'string' } },
    };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('may not start with $', { type: 'string' }, undefined, [
        'resources',
        'person',
        'schema',
        'properties',
        '$invalid',
      ]),
    ]);
  });

  it('should report missing properties in JSON schemas', async () => {
    const app = createTestApp();
    app.resources!.person.schema = { type: 'object' };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is missing properties', { type: 'object' }, undefined, [
        'resources',
        'person',
        'schema',
      ]),
    ]);
  });

  it('should report missing properties in JSON schemas resursively', async () => {
    const app = createTestApp();
    app.resources!.person.schema = {
      type: 'object',
      properties: { foo: { type: 'object' } },
    };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is missing properties', { type: 'object' }, undefined, [
        'resources',
        'person',
        'schema',
        'properties',
        'foo',
      ]),
    ]);
  });

  it('should report unknown required properties in JSON schemas', async () => {
    const app = createTestApp();
    app.resources!.person.schema = {
      type: 'object',
      required: ['bar'],
      properties: { foo: { type: 'object', properties: {}, required: ['baz'] } },
    };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is not defined in properties', 'bar', undefined, [
        'resources',
        'person',
        'schema',
        'required',
        0,
      ]),
      new ValidationError('is not defined in properties', 'baz', undefined, [
        'resources',
        'person',
        'schema',
        'properties',
        'foo',
        'required',
        0,
      ]),
    ]);
  });

  it('should validate page roles', async () => {
    const app = createTestApp();
    app.pages[0].roles = ['Unknown'];
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not exist in this app’s roles', 'Unknown', undefined, [
        'pages',
        0,
        'roles',
        0,
      ]),
    ]);
  });

  it('should validate block roles', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      roles: ['Unknown'],
    });
    const result = await validateAppDefinition(app, () => [
      { name: '@appsemble/test', version: '1.2.3', files: [], languages: [] },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not exist in this app’s roles', 'Unknown', undefined, [
        'pages',
        0,
        'blocks',
        0,
        'roles',
        0,
      ]),
    ]);
  });

  it('should validate inherited roles', async () => {
    const app = createTestApp();
    app.security!.roles!.User.inherits = ['Unknown'];
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not exist in this app’s roles', 'Unknown', undefined, [
        'security',
        'roles',
        'User',
        'inherits',
        0,
      ]),
    ]);
  });

  it('should report cyclic role inheritance', async () => {
    const app = createTestApp();
    app.security!.roles!.A = { inherits: ['B'] };
    app.security!.roles!.B = { inherits: ['C'] };
    app.security!.roles!.C = { inherits: ['E', 'A'] };
    app.security!.roles!.D = { inherits: ['A'] };
    app.security!.roles!.E = {};
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('cyclically inherits itself', { inherits: ['B'] }, undefined, [
        'security',
        'roles',
        'A',
      ]),
      new ValidationError('cyclically inherits itself', { inherits: ['C'] }, undefined, [
        'security',
        'roles',
        'B',
      ]),
      new ValidationError('cyclically inherits itself', { inherits: ['E', 'A'] }, undefined, [
        'security',
        'roles',
        'C',
      ]),
    ]);
  });

  it('should report unknown roles in resource notification hooks', async () => {
    const app = createTestApp();
    app.resources!.person.update!.hooks = {
      notification: {
        to: ['Unknown'],
      },
    };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is an unknown role', 'Unknown', undefined, [
        'resources',
        'person',
        'update',
        'hooks',
        'notifications',
        'to',
        0,
      ]),
    ]);
  });

  it('should allow $author in resource notification hooks', async () => {
    const app = createTestApp();
    app.resources!.person.update!.hooks = {
      notification: {
        to: ['$author'],
      },
    };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(true);
  });

  it('should report invalid resource references', async () => {
    const app = createTestApp();
    app.resources!.person.references = {
      name: {
        resource: 'non-existent',
      },
    };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is not an existing resource', 'non-existent', undefined, [
        'resources',
        'person',
        'references',
        'name',
        'resource',
      ]),
    ]);
  });

  it('should report invalid resource reference fields', async () => {
    const app = createTestApp();
    app.resources!.person.references = {
      invalid: {
        resource: 'person',
      },
    };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not exist on this resource', 'invalid', undefined, [
        'resources',
        'person',
        'references',
        'invalid',
      ]),
    ]);
  });

  it('should not report valid resource references', async () => {
    const app = createTestApp();
    app.resources!.person.references = {
      name: {
        resource: 'person',
      },
    };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(true);
  });

  it('should not crash if not resources exist', async () => {
    const result = await validateAppDefinition(
      { ...createTestApp(), resources: undefined },
      () => [],
    );
    expect(result.valid).toBe(true);
  });

  it('should report an invalid default language', async () => {
    const result = await validateAppDefinition(
      { ...createTestApp(), defaultLanguage: 'Klingon' },
      () => [],
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is not a valid language code', 'Klingon', undefined, [
        'defaultLanguage',
      ]),
    ]);
  });

  it('should allow a valid default language', async () => {
    const result = await validateAppDefinition(
      { ...createTestApp(), defaultLanguage: 'kln' },
      () => [],
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toStrictEqual([]);
  });

  it('should validate the default page exists', async () => {
    const result = await validateAppDefinition(
      { ...createTestApp(), defaultPage: 'Does not exist' },
      () => [],
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not refer to an existing page', 'Does not exist', undefined, [
        'defaultPage',
      ]),
    ]);
  });

  it('should check if the default page exists inside contained page', async () => {
    const result = await validateAppDefinition(
      { ...createTestApp(), defaultPage: 'Contained Page' },
      () => [],
    );
    expect(result.valid).toBe(true);
  });

  it('should validate the default page doesn’t specify parameters', async () => {
    const result = await validateAppDefinition(
      { ...createTestApp(), defaultPage: 'Page with parameters' },
      () => [],
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('may not specify parameters', 'Page with parameters', undefined, [
        'defaultPage',
      ]),
    ]);
  });

  it('should report invalid cronjob schedule syntax', async () => {
    const result = await validateAppDefinition(
      {
        ...createTestApp(),
        cron: { foo: { schedule: 'invalid cronjob test', action: { type: 'noop' } } },
      },
      () => [],
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('contains an invalid expression', 'invalid cronjob test', undefined, [
        'cron',
        'foo',
        'schedule',
      ]),
    ]);
  });

  it('should allow valid cronjob schedule syntax', async () => {
    const result = await validateAppDefinition(
      { ...createTestApp(), cron: { foo: { schedule: '5 4 * * *', action: { type: 'noop' } } } },
      () => [],
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toStrictEqual([]);
  });

  it('should not crash if cron is not a valid object', async () => {
    const result = await validateAppDefinition(
      // @ts-expect-error This tests invalid user input.
      { ...createTestApp(), cron: { foo: null, bar: { schedule: 12 } } },
      () => [],
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toStrictEqual([]);
  });

  it('should report an error if a link action contains a link to a page that doesn’t exist', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'link',
          to: 'Doesn’t exist',
        },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('refers to a page that doesn’t exist', 'Doesn’t exist', undefined, [
        'pages',
        0,
        'blocks',
        0,
        'actions',
        'onWhatever',
        'to',
      ]),
    ]);
  });

  it('should report an error if a link action contains a link to a sub page for a page without sub pages', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'link',
          to: ['Test Page', 'Bla'],
        },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'refers to a sub page on a page that isn’t of type ‘tabs’ or ‘flow’',
        'Bla',
        undefined,
        ['pages', 0, 'blocks', 0, 'actions', 'onWhatever', 'to', 1],
      ),
    ]);
  });

  it('should report an error if a link action contains a link to a tab that doesn’t exist', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'link',
          to: ['Page with tabs', 'Bla'],
        },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('refers to a tab that doesn’t exist', 'Bla', undefined, [
        'pages',
        0,
        'blocks',
        0,
        'actions',
        'onWhatever',
        'to',
        1,
      ]),
    ]);
  });

  it('should be valid if to is (remapper) object; considered as dynamic link', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'link',
          to: { static: 'test' },
        },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toStrictEqual([]);
  });

  it('should be valid if to is array of (remapper) objects; considered as dynamic link', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'link',
          to: [{ static: 'test' }],
        },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toStrictEqual([]);
  });

  it('should report an error if app member actions are used without a security definition', async () => {
    const { security, ...app } = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'app.member.login',
          email: 'example@example.com',
          password: 'password',
        },
      },
    });
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'app.member.register',
          email: 'example@example.com',
          password: 'password',
          name: 'Test User',
        },
      },
    });
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'app.member.current.patch',
        },
      },
    });

    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'refers to an app member action but the app doesn’t have a security definition',
        'app.member.login',
        undefined,
        ['pages', 0, 'blocks', 0, 'actions', 'onWhatever', 'type'],
      ),
      new ValidationError(
        'refers to an app member action but the app doesn’t have a security definition',
        'app.member.register',
        undefined,
        ['pages', 0, 'blocks', 1, 'actions', 'onWhatever', 'type'],
      ),
      new ValidationError(
        'refers to an app member action but the app doesn’t have a security definition',
        'app.member.current.patch',
        undefined,
        ['pages', 0, 'blocks', 2, 'actions', 'onWhatever', 'type'],
      ),
    ]);
  });

  it('should report an error if flow actions are used on a non-flow page', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'flow.next',
        },
      },
    });

    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'flow actions can only be used on pages with the type ‘flow’ or ‘loop’',
        'flow.next',
        undefined,
        ['pages', 0, 'blocks', 0, 'actions', 'onWhatever', 'type'],
      ),
    ]);
  });

  it('should report an error if flow.back is used on the first step', async () => {
    const app = createTestApp();
    (app.pages[3] as FlowPageDefinition).steps[0].blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'flow.back',
        },
      },
    });

    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('is not allowed on the first step in the flow', 'flow.back', undefined, [
        'pages',
        3,
        'steps',
        0,
        'blocks',
        0,
        'actions',
        'onWhatever',
        'type',
      ]),
    ]);
  });

  it('should report an error if flow.to refers to a step that doesn’t exist', async () => {
    const app = createTestApp();
    (app.pages[3] as FlowPageDefinition).steps[0].blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'flow.to',
          step: 'Some Step',
        },
      },
    });

    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('refers to a step that doesn’t exist', 'flow.to', undefined, [
        'pages',
        3,
        'steps',
        0,
        'blocks',
        0,
        'actions',
        'onWhatever',
        'step',
      ]),
    ]);
  });

  it('should report an error if flow.next is called on the last step without onFlowFinish', async () => {
    const app = createTestApp();
    (app.pages[3] as FlowPageDefinition).steps[1].blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'flow.next',
        },
      },
    });

    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'was defined on the last step but ‘onFlowFinish’ page action wasn’t defined',
        'flow.next',
        undefined,
        ['pages', 3, 'steps', 1, 'blocks', 0, 'actions', 'onWhatever', 'type'],
      ),
    ]);
  });

  it('should report an error if flow.finish is called without onFlowFinish', async () => {
    const app = createTestApp();
    (app.pages[3] as FlowPageDefinition).steps[1].blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'flow.finish',
        },
      },
    });

    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'was defined but ‘onFlowFinish’ page action wasn’t defined',
        'flow.finish',
        undefined,
        ['pages', 3, 'steps', 1, 'blocks', 0, 'actions', 'onWhatever', 'type'],
      ),
    ]);
  });

  it('should report an error if flow.cancel is called without onFlowCancel', async () => {
    const app = createTestApp();
    (app.pages[3] as FlowPageDefinition).steps[1].blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'flow.cancel',
        },
      },
    });

    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'was defined but ‘onFlowCancel’ page action wasn’t defined',
        'flow.cancel',
        undefined,
        ['pages', 3, 'steps', 1, 'blocks', 0, 'actions', 'onWhatever', 'type'],
      ),
    ]);
  });

  it('should report an error if a user register action on a block adds unsupported user properties', async () => {
    const app = {
      ...createTestApp(),
      members: {
        properties: {
          foo: {
            schema: {
              type: 'string',
            },
          },
        },
      },
    } as AppDefinition;
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'app.member.register',
          name: 'name',
          email: 'email@example.com',
          password: 'password',
          properties: {
            'object.from': {
              bar: 'baz',
            },
          },
        },
      },
    });

    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'contains a property that doesn’t exist in app member properties',
        'app.member.register',
        undefined,
        ['pages', 0, 'blocks', 0, 'actions', 'onWhatever', 'properties'],
      ),
    ]);
  });

  it('should report an error if a app member update action on a block adds unsupported app member properties', async () => {
    const app = {
      ...createTestApp(),
      members: {
        properties: {
          foo: {
            schema: {
              type: 'string',
            },
          },
        },
      },
    } as AppDefinition;
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'app.member.current.patch',
          name: 'name',
          properties: {
            'object.from': {
              bar: 'baz',
            },
          },
        },
      },
    });

    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'contains a property that doesn’t exist in app member properties',
        'app.member.current.patch',
        undefined,
        ['pages', 0, 'blocks', 0, 'actions', 'onWhatever', 'properties'],
      ),
    ]);
  });

  it('should report an error if a resource action on a block refers to a non-existent resource', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'resource.get',
          resource: 'Nonexistent',
        },
      },
    });

    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('refers to a resource that doesn’t exist', 'resource.get', undefined, [
        'pages',
        0,
        'blocks',
        0,
        'actions',
        'onWhatever',
        'resource',
      ]),
    ]);
  });

  it('should report an error if a resource action on the controller refers to a non-existent resource', async () => {
    const app = createTestApp();
    app.controller = {
      actions: {
        onWhatever: {
          type: 'resource.get',
          resource: 'Nonexistent',
        },
      },
    };
    const result = await validateAppDefinition(app, () => [], {
      actions: {
        onWhatever: {},
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('refers to a resource that doesn’t exist', 'resource.get', undefined, [
        'controller',
        'actions',
        'onWhatever',
        'resource',
      ]),
    ]);
  });

  it('should report an error if a resource action on a block is accessible by no roles in the app', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onWhatever: {
          type: 'resource.get',
          resource: 'person',
        },
      },
    });

    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        actions: {
          onWhatever: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'there is no one in the app who has permissions to use this action',
        'resource.get',
        undefined,
        ['pages', 0, 'blocks', 0, 'actions', 'onWhatever', 'resource'],
      ),
    ]);
  });

  it('should report an error if a resource action on the controller is accessible by no roles in the app', async () => {
    const app = createTestApp();
    app.controller = {
      actions: {
        onWhatever: {
          type: 'resource.get',
          resource: 'person',
        },
      },
    };
    const result = await validateAppDefinition(app, () => [], {
      actions: {
        onWhatever: {},
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'there is no one in the app who has permissions to use this action',
        'resource.get',
        undefined,
        ['controller', 'actions', 'onWhatever', 'resource'],
      ),
    ]);
  });

  it('should throw if an app is null', async () => {
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    const result = await validateAppDefinition(null, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      expect.objectContaining({
        message: 'App definition can not be null',
        instance: null,
        schema: {},
      }),
    ]);
  });

  it('should report an error if the defaultPage does not exist', async () => {
    const result = await validateAppDefinition(
      { name: 'Test App', pages: [], defaultPage: 'Test Page' },
      () => [],
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      expect.objectContaining({
        instance: 'Test Page',
        message: 'does not refer to an existing page',
      }),
    ]);
  });

  it('should handle if an unexpected error occurs', async () => {
    const result = await validateAppDefinition(
      {
        name: 'Test App',
        get defaultPage(): string {
          throw new Error('Boom!');
        },
        pages: [],
      },
      () => [],
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('Unexpected error: Boom!', null, undefined, []),
    ]);
  });

  it('should prevent block with layout float to be used in a dialog action', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onClick: {
          type: 'dialog',
          blocks: [
            {
              type: 'test',
              version: '1.2.3',
            },
          ],
        },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        layout: 'float',
        actions: {
          onClick: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'block with layout type: "float" is not allowed in a dialog action',
        '1.2.3',
        undefined,
        ['pages', 0, 'blocks', 0, 'actions', 'onClick', 'type'],
      ),
    ]);
  });

  it('should check app definition for blocks that have their layout manually set to float', async () => {
    const app = createTestApp();
    (app.pages[0] as BasicPageDefinition).blocks.push({
      type: 'test',
      version: '1.2.3',
      actions: {
        onClick: {
          type: 'dialog',
          blocks: [
            {
              type: 'test',
              version: '1.2.3',
              layout: 'float',
            },
          ],
        },
      },
    });
    const result = await validateAppDefinition(app, () => [
      {
        name: '@appsemble/test',
        version: '1.2.3',
        files: [],
        languages: [],
        layout: 'hidden',
        actions: {
          onClick: {},
        },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'block with layout type: "float" is not allowed in a dialog action',
        {
          layout: 'float',
          type: 'test',
          version: '1.2.3',
        },
        undefined,
        ['pages', 0, 'blocks', 0, 'actions', 'onClick', 'type'],
      ),
    ]);
  });

  it('should validate security definition', async () => {
    const { security, ...app } = createTestApp();
    (app as AppDefinition).security = {} as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'invalid security definition. Must define either guest or cron or roles and default',
        app,
        undefined,
        ['security'],
      ),
    ]);
  });

  it('should not throw if an action is used only in a cron', async () => {
    const app = createTestApp();
    Object.assign(app.security ?? {}, { cron: { permissions: ['$resource:person:create'] } });
    app.cron = {
      everyDayAtTwelve: {
        schedule: '* 12 * * *',
        action: {
          type: 'resource.create',
          resource: 'person',
        },
      },
    };

    const results = await validateAppDefinition(app, () => []);
    expect(results.valid).toBe(true);
  });

  it('should report if there is a cron security definition but cron is not defined', async () => {
    const app = createTestApp();
    app.security = {
      cron: {
        permissions: ['$group:query'],
      },
    } as Security;
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('can not define cron definition without a cron job', app, undefined, [
        'security',
        'cron',
      ]),
    ]);
  });

  it('should report an error on duplicate guest permissions', async () => {
    const app = createTestApp();

    app.security = {
      guest: {
        permissions: ['$group:query', '$group:query'],
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('duplicate permission declaration', app, undefined, [
        'security',
        'guest',
        'permissions',
        1,
      ]),
    ]);
  });

  it('should report an error when a guest resource permission references a non existing resource', async () => {
    const app = createTestApp();

    app.security = {
      guest: {
        permissions: ['$resource:unknown:query'],
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        "resource unknown does not exist in the app's resources definition",
        app,
        undefined,
        ['security', 'guest', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a guest resource permission for a specific resource is declared and there is already a resource permission with scope all declared', async () => {
    const app = createTestApp();

    app.security = {
      guest: {
        permissions: ['$resource:person:query', '$resource:all:query'],
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the query resource action with scope all is already declared',
        app,
        undefined,
        ['security', 'guest', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a guest resource view permission with scope all is declared and there is a resource that does not define the view', async () => {
    const app = createTestApp();

    app.security = {
      guest: {
        permissions: ['$resource:all:query:public'],
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
        },
      },
      note: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'resource note is missing a definition for the public view',
        app,
        undefined,
        ['security', 'guest', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a guest resource view permission is declared for a resource that does not define the view', async () => {
    const app = createTestApp();

    app.security = {
      guest: {
        permissions: ['$resource:person:query:public'],
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'resource person is missing a definition for the public view',
        app,
        undefined,
        ['security', 'guest', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a guest resource view permission redeclares a view permission for an already declared resource action view permission', async () => {
    const app = createTestApp();

    app.security = {
      guest: {
        permissions: ['$resource:person:query:public', '$resource:person:query:private'],
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
          private: {
            remap: 'log.info',
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'a view permission for the query action on resource person is already declared',
        app,
        undefined,
        ['security', 'guest', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a guest resource view permission redeclares a view permission for an already declared resource action view permission with scope all', async () => {
    const app = createTestApp();

    app.security = {
      guest: {
        permissions: ['$resource:person:query:public', '$resource:all:query:private'],
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
          private: {
            remap: 'log.info',
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'a view permission for the query action with scope all is already declared',
        app,
        undefined,
        ['security', 'guest', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a guest resource view permission is declared for a specific view and there is already a permission for the same resource action without a specific view', async () => {
    const app = createTestApp();

    app.security = {
      guest: {
        permissions: ['$resource:person:query:public', '$resource:person:query'],
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the query action on resource person without a specific view is already declared',
        app,
        undefined,
        ['security', 'guest', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a guest resource view permission is declared for a specific view and there is already a permission for the same resource action with scope all without a specific view', async () => {
    const app = createTestApp();

    app.security = {
      guest: {
        permissions: ['$resource:person:query:public', '$resource:all:query'],
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the query resource action with scope all without a specific view is already declared',
        app,
        undefined,
        ['security', 'guest', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a guest resource view permission is declared for a specific view and there is already a permission for the same resource action with scope all with the same view', async () => {
    const app = createTestApp();

    app.security = {
      guest: {
        permissions: ['$resource:person:query:public', '$resource:all:query:public'],
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the query resource action with scope all for this view is already declared',
        app,
        undefined,
        ['security', 'guest', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error on duplicate role permissions', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$group:query', '$group:query'],
        },
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('duplicate permission declaration', app, undefined, [
        'security',
        'roles',
        'test',
        'permissions',
        1,
      ]),
    ]);
  });

  it('should report an error if a role redeclares an inherited permission', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        inherited: {
          permissions: ['$group:query'],
        },
        test: {
          permissions: ['$group:query'],
          inherits: ['inherited'],
        },
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('permission is already inherited from another role', app, undefined, [
        'security',
        'roles',
        'test',
        'permissions',
        0,
      ]),
    ]);
  });

  it('should report an error when a role resource permission references a non existing resource', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$resource:unknown:query'],
        },
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        "resource unknown does not exist in the app's resources definition",
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a role resource permission for a specific resource is declared and there is already a resource permission with scope all declared', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$resource:person:query', '$resource:all:query'],
        },
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the query resource action with scope all is already declared',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a role resource permission for a specific resource is declared and there is already an inherited resource permission with scope all', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        inherited: {
          permissions: ['$resource:all:query'],
        },
        test: {
          permissions: ['$resource:person:query'],
          inherits: ['inherited'],
        },
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the query resource action with scope all is already inherited from another role',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a role resource view permission with scope all is declared and there is a resource that does not define the view', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$resource:all:query:public'],
        },
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'resource person is missing a definition for the public view',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a role resource view permission is declared for a resource that does not define the view', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$resource:person:query:public'],
        },
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'resource person is missing a definition for the public view',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a role resource view permission redeclares a view permission for an already declared resource action view permission', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$resource:person:query:public', '$resource:person:query:private'],
        },
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
          private: {
            remap: 'log.info',
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'a view permission for the query action on resource person is already declared',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a role resource view permission redeclares a view permission for an already declared resource action view permission with scope all', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$resource:person:query:public', '$resource:all:query:private'],
        },
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
          private: {
            remap: 'log.info',
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'a view permission for the query action with scope all is already declared',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a role resource view permission is declared for a specific view and there is already a permission for the same resource action without a specific view', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$resource:person:query:public', '$resource:person:query'],
        },
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the query action on resource person without a specific view is already declared',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a role resource view permission is declared for a specific view and there is already a permission for the same resource action with scope all without a specific view', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$resource:person:query:public', '$resource:all:query'],
        },
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the query resource action with scope all without a specific view is already declared',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a role resource view permission is declared for a specific view and there is already a permission for the same resource action with scope all with the same view', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$resource:person:query:public', '$resource:all:query:public'],
        },
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the query resource action with scope all for this view is already declared',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a role resource view permission redeclares a view permission for an already inherited resource action view permission', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        inherited: {
          permissions: ['$resource:person:query:private'],
        },
        test: {
          permissions: ['$resource:person:query:public'],
          inherits: ['inherited'],
        },
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
          private: {
            remap: 'log.info',
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'a view permission for the query action on resource person is already inherited from another role',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a role resource view permission redeclares a view permission for an already inherited resource action view permission with scope all', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        inherited: {
          permissions: ['$resource:all:query:private'],
        },
        test: {
          permissions: ['$resource:person:query:public'],
          inherits: ['inherited'],
        },
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
          private: {
            remap: 'log.info',
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'a view permission for the query action with scope all is already inherited from another role',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a role resource view permission is declared for a specific view and there is already an inherited permission for the same resource action without a specific view', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        inherited: {
          permissions: ['$resource:person:query'],
        },
        test: {
          permissions: ['$resource:person:query:public'],
          inherits: ['inherited'],
        },
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the query action on resource person without a specific view is already inherited from another role',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when a role resource view permission is declared for a specific view and there is already an inherited permission for the same resource action with scope all without a specific view', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        inherited: {
          permissions: ['$resource:all:query'],
        },
        test: {
          permissions: ['$resource:person:query:public'],
          inherits: ['inherited'],
        },
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the query resource action with scope all without a specific view is already inherited from another role',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('a should report an error when a role resource view permission is declared for a specific view and there is already a permission for the same resource action with scope all with the same view', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        inherited: {
          permissions: ['$resource:all:query:public'],
        },
        test: {
          permissions: ['$resource:person:query:public'],
          inherits: ['inherited'],
        },
      },
    } as Security;

    app.resources = {
      person: {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        views: {
          public: {
            remap: 'log.info',
          },
        },
      },
    };

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the query resource action with scope all for this view is already inherited from another role',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when an own resource permission references a resource that does not exist', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$resource:unknown:own:get'],
        },
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        "resource unknown does not exist in the app's resources definition",
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when an own resource permission is declared and there is already a generic resource permission for that action on that resource', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$resource:person:own:get', '$resource:person:get'],
        },
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the get resource action on resource person is already declared',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when an own resource permission is declared and there is already a generic resource permission with scope all for that action', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$resource:person:own:get', '$resource:all:get'],
        },
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the get resource action with scope all is already declared',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when an own resource permission is declared and there is already an own resource permission with scope all for that action', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$resource:person:own:get', '$resource:all:own:get'],
        },
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. An own permission for the get resource action with scope all is already declared',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when an own resource permission is declared and there is already an inherited generic resource permission for that action on that resource', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        inherited: {
          permissions: ['$resource:person:get'],
        },
        test: {
          permissions: ['$resource:person:own:get'],
          inherits: ['inherited'],
        },
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the get resource action on resource person is already inherited from another role',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when an own resource permission is declared and there is already an inherited generic resource permission with scope all for that action', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        inherited: {
          permissions: ['$resource:all:get'],
        },
        test: {
          permissions: ['$resource:person:own:get'],
          inherits: ['inherited'],
        },
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. A permission for the get resource action with scope all is already inherited from another role',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should report an error when an own resource permission is declared and there is already an inherited own resource permission with scope all for that action', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        inherited: {
          permissions: ['$resource:all:own:get'],
        },
        test: {
          permissions: ['$resource:person:own:get'],
          inherits: ['inherited'],
        },
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'redundant permission. An own permission for the get resource action with scope all is already inherited from another role',
        app,
        undefined,
        ['security', 'roles', 'test', 'permissions', 0],
      ),
    ]);
  });

  it('should not allow overwriting predefined roles', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'Member',
      },
      roles: {
        Member: {},
        MembersManager: {},
        GroupMembersManager: {},
        GroupsManager: {},
        ResourcesManager: {},
        Owner: {},
        cron: {},
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual(
      [...predefinedAppRoles, 'cron'].map(
        (role) =>
          new ValidationError(`not allowed to overwrite role ${role}`, app, undefined, [
            'security',
            'roles',
            role,
          ]),
      ),
    );
  });

  it('should throw an error on invalid role permissions', async () => {
    const app = createTestApp();

    app.security = {
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$resource:person:modify' as CustomAppPermission],
        },
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('invalid permission', app, undefined, [
        'security',
        'roles',
        'test',
        'permissions',
        0,
      ]),
    ]);
  });

  it('should throw an error on invalid guest permissions', async () => {
    const app = createTestApp();

    app.security = {
      guest: {
        permissions: ['$resource:person:own:modify' as CustomAppGuestPermission],
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('invalid permission', app, undefined, [
        'security',
        'guest',
        'permissions',
        0,
      ]),
    ]);
  });

  it('should throw an error on invalid guest inherited permissions', async () => {
    const app = createTestApp();

    app.security = {
      guest: {
        inherits: ['test'],
      },
      default: {
        role: 'test',
      },
      roles: {
        test: {
          permissions: ['$resource:person:own:get'],
        },
      },
    } as Security;

    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'invalid security definition. Guest cannot inherit roles that contain own resource permissions',
        app,
        undefined,
        ['security', 'guest', 'inherits'],
      ),
    ]);
  });

  it('should throw if the page layout templates do not match with the number of columns', async () => {
    const app = createTestApp();
    const invalidPageLayoutDefinition = {
      desktop: {
        spacing: {
          unit: '40px',
          gap: 1 / 8,
          padding: 1 / 4,
        },
        layout: {
          columns: 8,
          template: ['a a a a a a a a a a', 'b b b b b b b b', 'a a a a b b b b'],
        },
      },
    } as PageLayoutDefinition;
    Object.assign(app.pages[0], { layout: invalidPageLayoutDefinition });
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError(
        'template needs to be the same length as number of columns',
        invalidPageLayoutDefinition.desktop.layout.template,
        undefined,
        ['pages', 0, 'desktop', 'layout', 'template'],
      ),
    ]);
  });
});
