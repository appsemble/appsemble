import { describe, expect, it } from 'vitest';

import { analyze, describeIdentities } from './harness.js';
import { scenarios } from './scenarios.js';

describe('walk engine behavior', () => {
  it('descends array items, mounting a language component at each index', () => {
    const result = analyze(scenarios.arrayItems);
    const objects = describeIdentities(result);

    expect(objects['/gallery']).toBe('Gallery');
    expect(objects['/gallery/0']).toBe('Badge');
    expect(objects['/gallery/1']).toBe('Badge');
  });

  it('descends additionalProperties values, mounting a language component at each key', () => {
    const result = analyze(scenarios.mapValues);
    const objects = describeIdentities(result);

    expect(objects['/registry']).toBe('Registry');
    expect(objects['/registry/primary']).toBe('Badge');
    expect(objects['/registry/secondary']).toBe('Badge');
  });

  it('marks a tagged anyOf unresolved when its value matches no branch', () => {
    const result = analyze(scenarios.emptyAnyOf);
    const flexible = result.mountAt(['flexible']);

    expect(flexible).toBeDefined();
    expect(flexible!.localValid).toBe(false);
    expect(flexible!.identity.kind).toBe('unresolved');
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

  it('does not mount a ghost from a losing oneOf branch', () => {
    // PlainBranch wins; the FancyBranch.action hit must not become a language component.
    const result = analyze({ ghostHost: { action: { kind: 'noop' }, type: 'plain' } });

    expect(Object.keys(describeIdentities(result))).not.toContain('/ghostHost/action');
  });
});
