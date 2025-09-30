import { describe, expect, it } from 'vitest';

import { parseAddress } from './parseAddress.js';

describe('calculateVat', () => {
  it('Should return address split into house number and street name', () => {
    const address = '123 main street';
    const result = parseAddress(address);
    expect(result).toMatchObject({
      houseNumber: '123',
      streetName: 'main street',
    });
  });

  it('Should return address split into house number including suffixes and street name', () => {
    const address = '123 3a main street';
    const result = parseAddress(address);
    expect(result).toMatchObject({
      houseNumber: '123 3a',
      streetName: 'main street',
    });
  });

  it('Should return empty values for undefined input', () => {
    const result = parseAddress(null);
    expect(result).toMatchObject({
      houseNumber: '',
      streetName: '',
    });
  });

  it('Should return empty values for invalid address format', () => {
    const address = 'main street';
    const result = parseAddress(address);
    expect(result).toMatchObject({
      houseNumber: '',
      streetName: '',
    });
  });
});
