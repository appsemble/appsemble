import { describe, expect, it } from 'vitest';

import { mapValues } from './mapValues.js';

describe('mapValues', () => {
  it('should call the iteratee over each own property', () => {
    const proto = {
      nope: 'Discard me',
    };
    const data = Object.create(proto);
    data.yep = 'Overwrite me.';
    const result = mapValues(data, (value) => `${value} Done.`);
    expect(result).toStrictEqual({
      yep: 'Overwrite me. Done.',
    });
  });
});
