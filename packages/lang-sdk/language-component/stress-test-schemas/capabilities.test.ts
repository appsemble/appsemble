import { describe, expect, it } from 'vitest';

import { analyzeComponent, describeIdentities } from './harness.js';
import { componentScenarios } from './scenarios.js';

describe('walk engine behavior', () => {
  // Array, map, and unresolved-identity coverage lives in the scenario tables (baseline.test.ts).
  // These cases assert walk behavior the identity projection alone does not show: mount validity
  // and the divergence between the walk and the validator's short-circuit.
  it('marks a tagged anyOf mount invalid when its value matches no branch', () => {
    const result = analyzeComponent(
      componentScenarios.emptyAnyOf.root,
      componentScenarios.emptyAnyOf.data,
    );
    const flexible = result.mountAt([]);

    expect(flexible).toBeDefined();
    expect(flexible!.localValid).toBe(false);
  });

  it('mounts a child under a non-first anyOf branch (validator short-circuits)', () => {
    // TextWidget matches first, so the validator never evaluates BadgeHolder. The
    // walk evaluates every branch itself, so it still mounts Badge.
    const result = analyzeComponent('Host', { badge: { label: 'gold' }, text: 'hi' });

    expect(describeIdentities(result)['/badge']).toBe('Badge');
  });

  it('does not mount a language component placed only behind if/then (walk cannot navigate it)', () => {
    // The walk does not navigate `then`, and the hit fallback was removed (Appsemble
    // schemas are OpenAPI 3.0 and cannot express if/then). So Trinket is not mounted;
    // a walk-driven local probe would be needed to support conditional placement.
    const result = analyzeComponent(
      componentScenarios.conditionalPlacement.root,
      componentScenarios.conditionalPlacement.data,
    );

    expect(Object.keys(describeIdentities(result))).not.toContain('/trinket');
  });

  it('does not mount an annotated child from a losing oneOf branch', () => {
    // PlainBranch wins; the FancyBranch.action hit must not become a language component.
    const result = analyzeComponent(
      componentScenarios.losingBranchChild.root,
      componentScenarios.losingBranchChild.data,
    );

    expect(Object.keys(describeIdentities(result))).not.toContain('/action');
  });
});
