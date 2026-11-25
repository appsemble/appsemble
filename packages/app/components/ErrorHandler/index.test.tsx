import { fireEvent, render, screen } from '@testing-library/preact';
import { type VNode } from 'preact';
import { expect, it, vi } from 'vitest';

import { ErrorHandler } from './index.js';

interface FallbackProps {
  readonly error?: Error;
  readonly resetErrorBoundary: () => void;
}

function Fallback({ error, resetErrorBoundary }: FallbackProps): VNode {
  return (
    <button onClick={resetErrorBoundary} type="button">
      {error?.message}
    </button>
  );
}

it('should render its children if no errors are thrown', () => {
  render(
    <ErrorHandler fallback={Fallback}>
      <p>Test</p>
    </ErrorHandler>,
  );

  expect(screen.getByText('Test')).toBeDefined();
  expect(screen.queryByRole('button')).toBeNull();
});

it('should render its fallback until it is reset when errors are thrown', () => {
  vi.spyOn(console, 'error').mockImplementation(() => null);
  let shouldThrow = true;
  function Child(): VNode {
    if (shouldThrow) {
      throw new Error('test');
    }
    return <p>Recovered</p>;
  }

  render(
    <ErrorHandler fallback={Fallback}>
      <Child />
    </ErrorHandler>,
  );

  shouldThrow = false;
  fireEvent.click(screen.getByRole('button', { name: 'test' }));

  expect(screen.getByText('Recovered')).toBeDefined();
});
