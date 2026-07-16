import { describe, expect, it } from 'vitest';

import { analyze, describeIdentities } from './harness.js';
import { scenarios } from './scenarios.js';

describe('walk engine behavior', () => {
  // Array, map, and unresolved-identity coverage lives in the scenarios table (baseline.test.ts).
  // These cases assert walk behavior the identity projection alone does not show: mount validity
  // and the divergence between the walk and the validator's short-circuit.
  it('marks a tagged anyOf mount invalid when its value matches no branch', () => {
    const result = analyze(scenarios.emptyAnyOf.data);
    const flexible = result.mountAt(['flexible']);

    expect(flexible).toBeDefined();
    expect(flexible!.localValid).toBe(false);
  });

  it('mounts a child under a non-first anyOf branch (validator short-circuits)', () => {
    // TextWidget matches first, so the validator never evaluates BadgeHolder. The
    // walk evaluates every branch itself, so it still mounts Badge.
    const result = analyze({ host: { badge: { label: 'gold' }, text: 'hi' } });

    expect(describeIdentities(result)['/host/badge']).toBe('Badge');
  });

  it('does not mount a language component placed only behind if/then (walk cannot navigate it)', () => {
    // The walk does not navigate `then`, and the hit fallback was removed (Appsemble
    // schemas are OpenAPI 3.0 and cannot express if/then). So Trinket is not mounted;
    // a walk-driven local probe would be needed to support conditional placement.
    const result = analyze({ condHost: { mode: 'fancy', trinket: { gem: 'ruby' } } });

    expect(Object.keys(describeIdentities(result))).not.toContain('/condHost/trinket');
  });

  it('does not mount an annotated child from a losing oneOf branch', () => {
    // PlainBranch wins; the FancyBranch.action hit must not become a language component.
    const result = analyze({ actionBranchHost: { action: { kind: 'noop' }, type: 'plain' } });

    expect(Object.keys(describeIdentities(result))).not.toContain('/actionBranchHost/action');
  });
});
