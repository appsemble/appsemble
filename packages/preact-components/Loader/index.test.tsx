import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { Loader } from './index.js';

it('should have a classname of `appsemble-loader`', () => {
  render(<Loader />);
  const loader = screen.getByTestId('loader-comp');
  expect(loader.classList).toContain('appsemble-loader');
});
