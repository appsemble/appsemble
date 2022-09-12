import { createRef } from 'react';

import { applyRefs } from './applyRefs.js';

it('should apply function refs', () => {
  const spy = import.meta.jest.fn();
  applyRefs('callback value', (value) => spy(value));
  expect(spy).toHaveBeenCalledWith('callback value');
});

it('should apply object refs', () => {
  const ref = createRef();
  applyRefs('current value', ref);
  expect(ref.current).toBe('current value');
});

it('should ignore null refs', () => {
  expect(() => applyRefs('current value', null)).not.toThrow();
});

it('should apply multiple refs', () => {
  const spy = import.meta.jest.fn();
  const ref = createRef();
  applyRefs('multi value', (value) => spy(value), ref);
  expect(spy).toHaveBeenCalledWith('multi value');
  expect(ref.current).toBe('multi value');
});
