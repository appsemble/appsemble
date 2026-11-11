import { compileAppsembleDialect } from '@appsemble/lang-sdk';
import { findUnionCollisions, formatCollision } from '@appsemble/lang-sdk/language-component';
import { describe, expect, it } from 'vitest';

/*
 * Dialect-sanity gate. This is the reusable pattern a dialect uses to keep its own annotation honest,
 * through the package's public exports the way an outside dialect author would: compile it and assert
 * `findUnionCollisions` reports no `error` — no two distinct labeled components may share a ref-cut
 * local shape (a labeling-vs-shape contradiction the resolver couldn't tell apart).
 * Run against the shipped Appsemble AppDefinition (via the one official `compileAppsembleDialect`) so a
 * future schema change that introduces an ambiguous pair of components fails CI here, with a readable
 * message.
 */

const appDefinition = compileAppsembleDialect();
const collisions = findUnionCollisions(appDefinition);

describe('dialect sanity: Appsemble AppDefinition', () => {
  it('has no distinguishability errors', () => {
    // FormatCollision keeps a failure readable: "[error] <Union> (oneOf): A vs B not distinguishable…".
    expect(
      collisions.filter((collision) => collision.severity === 'error').map(formatCollision),
    ).toStrictEqual([]);
  });

  it('has no primitive components (a primitive must be a controlled property, not an identity)', () => {
    expect(appDefinition.primitiveComponents).toStrictEqual([]);
  });

  it('surfaces the known ref-cut warnings for review', () => {
    const warned = new Set(
      collisions
        .filter((collision) => collision.severity === 'warning')
        .map((collision) => collision.unionName),
    );
    // Labeled components whose own forms overlap — identified correctly, fields over-broaden.
    expect(warned).toContain('AppMemberPropertyDefinition');
    expect(warned).toContain('TabsPageDefinition');
  });
});
