import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { LanguageComponent, LanguageCtx } from './index.js';

/*
 * Discriminated-union resolution: a tagged oneOf/anyOf resolves the ONE branch its discriminant
 * selects instead of walking every branch. Standard OpenAPI `discriminator` (single field) covers
 * the action-style unions; the `x-appsemble-discriminator` extension adds composite keys (blocks,
 * type+version). See resolve.ts (`readDiscriminator`/`pickBranch` + the fast-path in `resolve`).
 */

// Branch components, each pinning the discriminant via `const`.
const LinkAction = LanguageComponent.define(
  'LinkAction',
  {
    type: 'object',
    required: ['type', 'to'],
    properties: { type: { const: 'link' }, to: { type: 'string' } },
  },
  {},
);
const DialogAction = LanguageComponent.define(
  'DialogAction',
  { type: 'object', required: ['type'], properties: { type: { const: 'dialog' } } },
  {},
);

// A single-field discriminated union (standard OpenAPI keyword).
const ActionDefinition = LanguageComponent.define(
  'ActionDefinition',
  {
    oneOf: [
      { $ref: '#/components/schemas/LinkAction' },
      { $ref: '#/components/schemas/DialogAction' },
    ],
    discriminator: {
      propertyName: 'type',
      mapping: {
        link: '#/components/schemas/LinkAction',
        dialog: '#/components/schemas/DialogAction',
      },
    },
  } as Schema,
  {},
);

const actionCtx = LanguageCtx.compile(
  LanguageComponent.schemas([LinkAction, DialogAction, ActionDefinition]),
  'ActionDefinition',
);

// A composite (type+version) discriminated union via the Appsemble extension.
const ButtonBlock = LanguageComponent.define(
  'ButtonBlock',
  {
    type: 'object',
    properties: {
      type: { const: 'button' },
      version: { const: '0.0.0' },
      icon: { type: 'string' },
    },
  },
  {},
);
const TableBlock = LanguageComponent.define(
  'TableBlock',
  {
    type: 'object',
    properties: {
      type: { const: 'table' },
      version: { const: '0.0.0' },
      fields: { type: 'array' },
    },
  },
  {},
);
const BlockDefinition = LanguageComponent.define(
  'BlockDefinition',
  {
    oneOf: [
      { $ref: '#/components/schemas/ButtonBlock' },
      { $ref: '#/components/schemas/TableBlock' },
    ],
    'x-appsemble-discriminator': {
      propertyNames: ['type', 'version'],
      mapping: {
        'button@0.0.0': '#/components/schemas/ButtonBlock',
        'table@0.0.0': '#/components/schemas/TableBlock',
      },
    },
  } as Schema,
  {},
);

const blockCtx = LanguageCtx.compile(
  LanguageComponent.schemas([ButtonBlock, TableBlock, BlockDefinition]),
  'BlockDefinition',
);

// A union with one untagged branch (a basic page has no `type`), resolved via a `default` tag.
const BasicPage = LanguageComponent.define(
  'BasicPage',
  { type: 'object', required: ['blocks'], properties: { blocks: { type: 'array' } } },
  {},
);
const TabsPage = LanguageComponent.define(
  'TabsPage',
  {
    type: 'object',
    required: ['type', 'tabs'],
    properties: { type: { enum: ['tabs'] }, tabs: {} },
  },
  {},
);
const PageDefinition = LanguageComponent.define(
  'PageDefinition',
  {
    anyOf: [{ $ref: '#/components/schemas/BasicPage' }, { $ref: '#/components/schemas/TabsPage' }],
    'x-appsemble-discriminator': {
      propertyNames: ['type'],
      default: 'basic',
      // Only the untagged branch needs a mapping: BasicPage has no `type`, so the tag 'basic' can't be
      // read off it. TabsPage is inferred from its own `type: ['tabs']` enum — declaring it would be
      // redundant (pickBranch tries mapping, then the branch's own tag, then the ref name).
      mapping: { basic: '#/components/schemas/BasicPage' },
    },
  } as Schema,
  {},
);
const pageCtx = LanguageCtx.compile(
  LanguageComponent.schemas([BasicPage, TabsPage, PageDefinition]),
  'PageDefinition',
);

describe('discriminated-union resolution', () => {
  it('resolves the branch its single-field tag selects', () => {
    const { identity } = actionCtx.root({ type: 'link', to: 'Home' });
    expect(identity?.kind).toBe('composite');
    expect(identity?.kind === 'composite' && identity.parts.map((p) => p.name)).toContain(
      'LinkAction',
    );
  });

  it('gives a precise diagnostic for an unknown tag, naming it', () => {
    const { identity } = actionCtx.root({ type: 'teleport' });
    expect(identity?.kind).toBe('unresolved');
    expect(identity?.kind === 'unresolved' && identity.reason).toMatch(/teleport/);
  });

  it('resolves a composite (type+version) tag via x-appsemble-discriminator', () => {
    const { identity } = blockCtx.root({ type: 'table', version: '0.0.0', fields: [] });
    expect(identity?.kind === 'composite' && identity.parts.map((p) => p.name)).toContain(
      'TableBlock',
    );
  });

  it('rejects a composite tag whose combination is unknown', () => {
    const { identity } = blockCtx.root({ type: 'button', version: '9.9.9' });
    expect(identity?.kind).toBe('unresolved');
    expect(identity?.kind === 'unresolved' && identity.reason).toMatch(/button@9\.9\.9/);
  });

  it('resolves a tagged branch when the discriminant is present', () => {
    const { identity } = pageCtx.root({ type: 'tabs', tabs: [] });
    expect(identity?.kind === 'composite' && identity.parts.map((p) => p.name)).toContain(
      'TabsPage',
    );
  });

  it('resolves the untagged branch via `default` when the discriminant is absent', () => {
    const { identity } = pageCtx.root({ blocks: [] });
    expect(identity?.kind === 'composite' && identity.parts.map((p) => p.name)).toContain(
      'BasicPage',
    );
  });
});
