import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { Loader } from './index.js';

it('should have a classname of `appsemble-loader`', () => {
  render(<Loader label="Loading" />);
  expect(screen.getByRole('status').classList).toContain('appsemble-loader');
});

it('should announce its label as a status', () => {
  render(<Loader label="Loading" />);
  expect(screen.getByRole('status').textContent).toBe('Loading');
});

it('should not render an empty label', () => {
  render(<Loader />);
  expect(screen.getByRole('status').textContent).toBe('');
});
