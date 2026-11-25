import { act, renderHook } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { useToggle } from './useToggle.js';

it('should keep its toggle function stable while toggling', () => {
  const { result } = renderHook(() => useToggle());
  const { toggle } = result.current;

  act(() => {
    toggle();
  });
  expect(result.current.enabled).toBe(true);
  expect(result.current.toggle).toBe(toggle);

  act(() => {
    toggle();
  });
  expect(result.current.enabled).toBe(false);
});

it('should apply repeated toggles within one update', () => {
  const { result } = renderHook(() => useToggle());

  act(() => {
    result.current.toggle();
    result.current.toggle();
    result.current.toggle();
  });
  expect(result.current.enabled).toBe(true);
});
