import { describe, expect, it } from 'vitest';

import { feedErrorCodes, getFeedErrorState, normalizeFeedData } from './normalizeFeedData.js';

describe('normalizeFeedData', () => {
  it('should return an empty array if an error is provided', () => {
    expect(normalizeFeedData([{ id: 1 }], 'error.generic')).toStrictEqual([]);
  });

  it('should return an empty array for null data', () => {
    expect(normalizeFeedData(null)).toStrictEqual([]);
  });

  it('should return the received data for valid arrays', () => {
    expect(normalizeFeedData([{ id: 1 }, { id: 2 }])).toStrictEqual([{ id: 1 }, { id: 2 }]);
  });
});

describe('getFeedErrorState', () => {
  it('should return permissionDenied true for forbidden error codes', () => {
    expect(getFeedErrorState(feedErrorCodes.forbidden)).toStrictEqual({ permissionDenied: true });
  });

  it('should return permissionDenied false for other errors', () => {
    expect(getFeedErrorState('Forbidden')).toStrictEqual({ permissionDenied: false });
    expect(getFeedErrorState('error.generic')).toStrictEqual({ permissionDenied: false });
    expect(getFeedErrorState()).toStrictEqual({ permissionDenied: false });
  });
});
