import { describe, expect, it } from 'vitest';

import { dataLoadErrorCodes, getDataLoadError } from './utils.js';

describe('getDataLoadError', () => {
  it('should return forbidden for 403 responses', () => {
    expect(getDataLoadError({ response: { status: 403 } })).toBe(dataLoadErrorCodes.forbidden);
  });

  it('should return a generic error for non-403 responses', () => {
    expect(getDataLoadError({ response: { status: 500 } })).toBe(dataLoadErrorCodes.generic);
  });

  it('should return a generic error for unknown errors', () => {
    expect(getDataLoadError(new Error('boom'))).toBe(dataLoadErrorCodes.generic);
    expect(getDataLoadError(null)).toBe(dataLoadErrorCodes.generic);
  });
});
