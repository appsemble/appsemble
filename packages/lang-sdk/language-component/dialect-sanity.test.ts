import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import * as rawSchemas from '../schemas/index.js';
import { formatCollision, LanguageComponent, LanguageCtx } from './index.js';

/*
 * Dialect-sanity gate. This is the reusable pattern a dialect uses to keep its own annotation honest:
 * compile it and assert `distinguishabilityErrors` is empty — no two distinct labeled components may
 * share a ref-cut local shape (a labeling-vs-shape contradiction the resolver couldn't tell apart).
 * Run against the shipped Appsemble AppDefinition so a future schema change that introduces an
 * ambiguous pair of components fails CI here, with a readable message.
 */

const appDefinition = LanguageCtx.compile(
  LanguageComponent.annotate(rawSchemas as unknown as Record<string, Schema>),
  'AppDefinition',
);

describe('dialect sanity: Appsemble AppDefinition', () => {
  it('has no distinguishability errors', () => {
    // formatCollision keeps a failure readable: "[error] <Union> (oneOf): A vs B not distinguishable…".
    expect(appDefinition.distinguishabilityErrors.map(formatCollision)).toStrictEqual([]);
  });

  it('surfaces the known ref-cut warnings for review', () => {
    const warned = new Set(
      appDefinition.distinguishabilityLint
        .filter((collision) => collision.severity === 'warning')
        .map((collision) => collision.unionName),
    );
    // Labeled components whose own forms overlap — identified correctly, fields over-broaden.
    expect(warned).toContain('AppMemberPropertyDefinition');
    expect(warned).toContain('TabsPageDefinition');
  });
});
