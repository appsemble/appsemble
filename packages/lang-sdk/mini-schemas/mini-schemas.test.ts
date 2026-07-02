import { describe, expect, it } from 'vitest';

import { analyze, describeIdentities } from './harness.js';
import { scenarios } from './scenarios.js';

describe('mini schema language component analysis', () => {
  it('should resolve valid oneOf, anyOf, and allOf language components', () => {
    const result = analyze(scenarios.normal);

    expect(result.documentValid).toBe(true);
    expect(describeIdentities(result)).toStrictEqual({
      '/composed': 'StoredText:allOf(Identified, Timestamped, TextWidget)',
      '/flexible': 'FlexibleThing:anyOf(TextWidget, IconWidget)',
      '/scaryWidget': 'ScaryWidget:oneOf(ExperimentalButton)',
      '/widget': 'Widget:oneOf(IconWidget)',
    });
  });

  it('should keep local identity when an outer constraint invalidates the document', () => {
    const result = analyze(scenarios.scaryProduction);

    expect(result.documentValid).toBe(false);
    expect(describeIdentities(result)).toStrictEqual({
      '/scaryWidget': 'ScaryWidget:oneOf(ExperimentalButton)',
    });
    const interpretations = [...result.interpretations.values()];
    expect(interpretations).toHaveLength(1);
    expect(interpretations[0]).toMatchObject({
      localValid: true,
      path: ['scaryWidget'],
    });
    expect(interpretations[0].errors).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'does not exactly match expected constant: false',
          path: ['scaryWidget', 'experimental'],
        }),
      ]),
    );
  });

  it('should resolve the valid production variant', () => {
    const result = analyze(scenarios.scaryProductionFixed);

    expect(result.documentValid).toBe(true);
    expect(describeIdentities(result)).toStrictEqual({
      '/scaryWidget': 'ScaryWidget:oneOf(StandardButton)',
    });
  });

  it('should leave ambiguous oneOf language components unresolved', () => {
    const result = analyze(scenarios.cursedA);

    expect(result.documentValid).toBe(false);
    expect(describeIdentities(result)).toStrictEqual({
      '/cursedA':
        'unresolved(oneOf expected exactly one match, got 2) [ButtonWidget, TextAndIcon:allOf(TextWidget, IconWidget)]',
    });
  });

  it('should leave allOf language components unresolved when one part is ambiguous', () => {
    const result = analyze(scenarios.cursedB);

    expect(result.documentValid).toBe(false);
    expect(describeIdentities(result)).toStrictEqual({
      '/cursedB':
        'unresolved(allOf did not fully match) [unresolved(oneOf expected exactly one match, got 2) [ButtonWidget, TextWidget], IconOrTrackable:anyOf(IconWidget, Trackable)]',
    });
  });

  it('should resolve nested same-path algebra when branches are distinguishable', () => {
    const result = analyze(scenarios.cursedValid);

    expect(result.documentValid).toBe(true);
    expect(describeIdentities(result)).toStrictEqual({
      '/cursedValid':
        'CursedValid:allOf(StrictButtonOrText:oneOf(StrictButton), StrictIconOrTrackable:anyOf(IconWidget, Trackable))',
    });
  });

  it('should leave indistinguishable oneOf candidates unresolved', () => {
    const result = analyze(scenarios.ghost);

    expect(result.documentValid).toBe(false);
    expect(describeIdentities(result)).toStrictEqual({
      '/ghostWidget':
        'unresolved(oneOf expected exactly one match, got 2) [StandardGhostButton, ExperimentalGhostButton]',
    });
  });

  it('should leave locally invalid values unresolved', () => {
    const result = analyze(scenarios.invalidLocal);

    expect(result.documentValid).toBe(false);
    expect(describeIdentities(result)).toStrictEqual({
      '/widget': 'unresolved(oneOf expected exactly one match, got 0) []',
    });
  });
});
