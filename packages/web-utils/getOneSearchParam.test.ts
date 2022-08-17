import { getOneSearchParam } from './getOneSearchParam.js';

it('should return null if no values are available', () => {
  const qs = new URLSearchParams();
  const result = getOneSearchParam(qs, 'vehicle');
  expect(result).toBeNull();
});

it('should return the value if one value is available', () => {
  const qs = new URLSearchParams();
  qs.append('vehicle', 'car');
  const result = getOneSearchParam(qs, 'vehicle');
  expect(result).toBe('car');
});

it('should return null if multiple values are available', () => {
  const qs = new URLSearchParams();
  qs.append('vehicle', 'car');
  qs.append('vehicle', 'plane');
  const result = getOneSearchParam(qs, 'vehicle');
  expect(result).toBeNull();
});
