import { AppDefinition, BasicPageDefinition, TabsPageDefinition } from '@appsemble/types';
import { ValidationError } from 'jsonschema';

import { validateAppDefinition } from './validation';

function createTestApp(): AppDefinition & { pages: (BasicPageDefinition | TabsPageDefinition)[] } {
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

  it('should validate block parameters', async () => {
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
      new ValidationError('requires property "foo"', {}, undefined, [
        'pages',
        0,
        'blocks',
        0,
        'parameters',
      ]),
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
      new ValidationError('is now allowed on this block type', {}, undefined, [
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
      new ValidationError('is now allowed on this block', {}, undefined, [
        'pages',
        0,
        'blocks',
        0,
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

  it('should report unknown event emitters', async () => {
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
          emit: {},
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

  it('should allow $any matching unknown event emitters', async () => {
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
    expect(result.valid).toBe(true);
  });

  it('should report unknown event listeners', async () => {
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
          listen: {},
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

  it('should allow $any matching unknown event listener', async () => {
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
    expect(result.valid).toBe(true);
  });

  it('should not crash if security is undefined', async () => {
    const app = createTestApp();
    delete app.security;
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(true);
  });

  it('should validate the default role exists', async () => {
    const app = createTestApp();
    app.security.default.role = 'Unknown';
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

  it('should validate the top level default roles exist', async () => {
    const app = createTestApp();
    app.roles = ['Unknown'];
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not exist in this app’s roles', 'Unknown', undefined, ['roles', 0]),
    ]);
  });

  it('should validate the resource roles exist', async () => {
    const app = createTestApp();
    app.resources.person.roles = ['Unknown'];
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not exist in this app’s roles', 'Unknown', undefined, [
        'resources',
        'person',
        'roles',
        0,
      ]),
    ]);
  });

  it('should validate the resource action roles', async () => {
    const app = createTestApp();
    app.resources.person.count = { roles: ['Unknown'] };
    app.resources.person.create = { roles: ['Unknown'] };
    app.resources.person.delete = { roles: ['Unknown'] };
    app.resources.person.get = { roles: ['Unknown'] };
    app.resources.person.query = { roles: ['Unknown'] };
    app.resources.person.update = { roles: ['Unknown'] };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not exist in this app’s roles', 'Unknown', undefined, [
        'resources',
        'person',
        'count',
        'roles',
        0,
      ]),
      new ValidationError('does not exist in this app’s roles', 'Unknown', undefined, [
        'resources',
        'person',
        'create',
        'roles',
        0,
      ]),
      new ValidationError('does not exist in this app’s roles', 'Unknown', undefined, [
        'resources',
        'person',
        'delete',
        'roles',
        0,
      ]),
      new ValidationError('does not exist in this app’s roles', 'Unknown', undefined, [
        'resources',
        'person',
        'get',
        'roles',
        0,
      ]),
      new ValidationError('does not exist in this app’s roles', 'Unknown', undefined, [
        'resources',
        'person',
        'query',
        'roles',
        0,
      ]),
      new ValidationError('does not exist in this app’s roles', 'Unknown', undefined, [
        'resources',
        'person',
        'update',
        'roles',
        0,
      ]),
    ]);
  });

  it('should allow the $author role for resource actions', async () => {
    const app = createTestApp();
    app.resources.person.roles = ['$author'];
    app.resources.person.count = { roles: ['$author'] };
    app.resources.person.create = { roles: ['$author'] };
    app.resources.person.delete = { roles: ['$author'] };
    app.resources.person.get = { roles: ['$author'] };
    app.resources.person.query = { roles: ['$author'] };
    app.resources.person.update = { roles: ['$author'] };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('does not exist in this app’s roles', '$author', undefined, [
        'resources',
        'person',
        'create',
        'roles',
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
    app.security.roles.User.inherits = ['Unknown'];
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
    app.security.roles.A = { inherits: ['B'] };
    app.security.roles.B = { inherits: ['C'] };
    app.security.roles.C = { inherits: ['E', 'A'] };
    app.security.roles.D = { inherits: ['A'] };
    app.security.roles.E = {};
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('cyclicly inherits itself', { inherits: ['B'] }, undefined, [
        'security',
        'roles',
        'A',
      ]),
      new ValidationError('cyclicly inherits itself', { inherits: ['C'] }, undefined, [
        'security',
        'roles',
        'B',
      ]),
      new ValidationError('cyclicly inherits itself', { inherits: ['E', 'A'] }, undefined, [
        'security',
        'roles',
        'C',
      ]),
    ]);
  });

  it('should report unknown roles in resource notification hooks', async () => {
    const app = createTestApp();
    app.resources.person.update.hooks = {
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

  it('should allow $author in resource notifcation hooks', async () => {
    const app = createTestApp();
    app.resources.person.update.hooks = {
      notification: {
        to: ['$author'],
      },
    };
    const result = await validateAppDefinition(app, () => []);
    expect(result.valid).toBe(true);
  });

  it('should report invalid resource references', async () => {
    const app = createTestApp();
    app.resources.person.references = {
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
    app.resources.person.references = {
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
    app.resources.person.references = {
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

  it('should validate the default page doesn’t specify parameters', async () => {
    const result = await validateAppDefinition(
      { ...createTestApp(), defaultPage: 'Page with parameters' },
      () => [],
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toStrictEqual([
      new ValidationError('may not specifiy parameters', 'Page with parameters', undefined, [
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

  it('should ignore if an app is null', async () => {
    const result = await validateAppDefinition(null, () => []);
    expect(result.valid).toBe(true);
    expect(result.errors).toStrictEqual([]);
  });

  it('should if app pages are not an array', async () => {
    const result = await validateAppDefinition(null, () => []);
    expect(result.valid).toBe(true);
    expect(result.errors).toStrictEqual([]);
  });

  it('should report an error if app validation fails for an unexpected reason', async () => {
    const result = await validateAppDefinition(null, () => []);
    expect(result.valid).toBe(true);
    expect(result.errors).toStrictEqual([]);
  });

  it('should handle if an unexpected error occurs', async () => {
    const result = await validateAppDefinition(
      {
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
});
