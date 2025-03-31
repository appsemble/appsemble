import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Document, parseDocument, type YAMLMap } from 'yaml';

import { applyPatch } from './migrateAppDefinitions.js';
import { collectPaths } from '../utils/yaml.js';

describe('collectPaths', () => {
  let document: Document;

  beforeAll(() => {
    document = parseDocument(`
      name: test
      description: test
      defaultPage: test

      anchors:
        - &version 0.0.0
        - &custom-block-version 0.0.0
        - &block1
          type: test
          version: *version
        - &block2
          type: test
          version: 0.0.0
        - &block3
          type: test
          version: *custom-block-version
        - &as-key
          0.0.0: test

      resources:
        test:
          roles: [$public]
          schema:
            additionalProperties: false
            type: object
            properties:
              test:
                type: string

      pages:
        - name: test
          blocks:
            - type: test
              version: *version
              actions:
                onClick:
                  type: resource.create
                  resource: test
                  method: post
            - type: test
              version: *version
              actions:
                onClick:
                  type: resource.get
                  resource: test
                  method: get
            - *block1
            - *block2
            - *block3
            - type: test
              version: *as-key`);
  });

  it.each([
    {
      message: 'handle regex',
      path: [/d.*/],
      expected: [
        [['description'], ['defaultPage']],
        [['description'], ['defaultPage']],
      ],
    },
    {
      message: 'handle exact paths',
      path: ['pages', 0, 'name', 'test'],
      expected: [[['pages', 0, 'name', 'test']], [['pages', 0, 'name', 'test']]],
    },
    {
      message: 'handle wildcards in path',
      path: ['*', 'actions', '*', 'test'],
      expected: [
        [
          ['pages', 0, 'blocks', 0, 'actions', 'onClick', 'resource', 'test'],
          ['pages', 0, 'blocks', 1, 'actions', 'onClick', 'resource', 'test'],
        ],
        [
          ['pages', 0, 'blocks', 0, 'actions', 'onClick', 'resource', 'test'],
          ['pages', 0, 'blocks', 1, 'actions', 'onClick', 'resource', 'test'],
        ],
      ],
    },
    {
      message: 'handle wildcards with back references',
      path: ['*', 'actions', '*', 'type', /^resource\..*/, '<', '<', 'method'],
      expected: [
        [
          ['pages', 0, 'blocks', 0, 'actions', 'onClick', 'method'],
          ['pages', 0, 'blocks', 1, 'actions', 'onClick', 'method'],
        ],
        [
          ['pages', 0, 'blocks', 0, 'actions', 'onClick', 'type', 'resource.create', 'method'],
          ['pages', 0, 'blocks', 1, 'actions', 'onClick', 'type', 'resource.get', 'method'],
        ],
      ],
    },
    {
      message: 'handle back reference at the end of a path',
      path: ['resources', /\w+/, 'roles', /.*/, '<'],
      expected: [[['resources', 'test', 'roles']], [['resources', 'test', 'roles', 0]]],
    },
    {
      message: 'handle anchors',
      path: ['pages', '*', 'blocks', '*', 'version', '0.0.0'],
      expected: [
        [
          ['anchors', 0, '0.0.0'],
          ['anchors', 3, 'version', '0.0.0'],
          ['anchors', 1, '0.0.0'],
          ['anchors', 5, '0.0.0'],
        ],
        [
          ['pages', 0, 'blocks', 0, 'version', 'anchors', 0, '0.0.0'],
          ['pages', 0, 'blocks', 'anchors', 3, 'version', '0.0.0'],
          ['pages', 0, 'blocks', 'anchors', 4, 'version', 'anchors', 1, '0.0.0'],
          ['pages', 0, 'blocks', 5, 'version', 'anchors', 5, '0.0.0'],
        ],
      ],
    },
  ])('should $message', ({ expected, path }) => {
    const output = collectPaths(path, document.contents as YAMLMap);
    expect(output).toStrictEqual(expected);
  });
});

describe('applyPatch', () => {
  const doc = `
name: test
description: test
defaultPage: test

resources:
  test:
    roles: [ $public ]
    schema:
      additionalProperties: false
      type: object
      properties:
        test:
          type: string

pages:
  - name: test
    blocks:
      - type: test
        version: 0.0.0
        actions:
          onClick:
            type: resource.create
            resource: test
            method: post
      - type: test
        version: 0.0.0
        actions:
          onClick:
            type: resource.get
            resource: test
            method: get`;
  let document: Document;

  beforeEach(() => {
    document = parseDocument(doc);
  });

  it.each([
    {
      patch: { message: 'handle delete operation', path: [/pages|resources/], delete: true },
      changed: true,
      expected: `
name: test
description: test
defaultPage: test`,
    },
    {
      patch: {
        message: 'handle replace operation',
        path: ['*', 'additionalProperties'],
        value: true,
      },
      changed: true,
      expected: `
name: test
description: test
defaultPage: test

resources:
  test:
    roles: [ $public ]
    schema:
      additionalProperties: true
      type: object
      properties:
        test:
          type: string

pages:
  - name: test
    blocks:
      - type: test
        version: 0.0.0
        actions:
          onClick:
            type: resource.create
            resource: test
            method: post
      - type: test
        version: 0.0.0
        actions:
          onClick:
            type: resource.get
            resource: test
            method: get`,
    },
    {
      patch: {
        message: 'handle replace function with additional paths',
        path: ['*', 'actions', '*', 'type', /^resource\..*/, '<', '<', 'method'],
        delete: true,
      },
      changed: true,
      expected: `
name: test
description: test
defaultPage: test

resources:
  test:
    roles: [ $public ]
    schema:
      additionalProperties: false
      type: object
      properties:
        test:
          type: string

pages:
  - name: test
    blocks:
      - type: test
        version: 0.0.0
        actions:
          onClick:
            type: resource.create
            resource: test
      - type: test
        version: 0.0.0
        actions:
          onClick:
            type: resource.get
            resource: test`,
    },
    {
      patch: {
        message: 'return false if nothing changed',
        path: ['idk'],
        delete: true,
      },
      changed: false,
      expected: doc,
    },
  ])('should $patch.message', async ({ changed, expected, patch }) => {
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    const output = await applyPatch(patch, document, null);
    expect(output).toBe(changed);
    expect(String(document).trim()).toStrictEqual(expected.trim());
  });
});
