import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { Loader } from './index.js';

it('should have a classname of `appsemble-loader`', () => {
  render(<Loader label="Loading" />);
  const loader = screen.getByTestId('loader-comp');
  expect(loader.classList).toContain('appsemble-loader');
});

it('should announce its label as a status', () => {
  render(<Loader label="Loading" />);
  expect(screen.getByRole('status').textContent).toBe('Loading');
});
