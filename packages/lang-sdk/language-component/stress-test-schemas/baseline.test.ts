import { describe, expect, it } from 'vitest';

import { analyze, describeIdentities } from './harness.js';
import { scenarios } from './scenarios.js';

const cases = Object.entries(scenarios).map(([name, scenario]) => ({ name, ...scenario }));

describe('mini schema language component analysis', () => {
  // Every scenario declares the identity mounted at each path and whether the document validates.
  // Asserting the whole table here makes scenarios.ts the single source of truth for engine output.
  it.each(cases)('$name: $doc', ({ data, documentValid, identities }) => {
    const result = analyze(data);

    expect(result.documentValid).toBe(documentValid);
    expect(describeIdentities(result)).toStrictEqual(identities);
  });

  // The experimentalVariantInProduction case additionally proves the shape of a kept-but-invalid node: a single
  // mount that stays locally valid while the outer constraint error is attached to it.
  it('keeps the local mount valid and attaches the outer constraint error', () => {
    const result = analyze(scenarios.experimentalVariantInProduction.data);
    const mounts = [...result.mounts.values()];

    expect(mounts).toHaveLength(1);
    expect(mounts[0]).toMatchObject({
      localValid: true,
      path: ['productionVariantHost', 'buttonVariant'],
    });
    expect(mounts[0].errors).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'does not exactly match expected constant: false',
          path: ['productionVariantHost', 'buttonVariant', 'experimental'],
        }),
      ]),
    );
  });
});
