import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { Option } from './index.js';

it('should render an option', () => {
  render(<Option data-testid="option" value="test" />);
  const option = screen.getByTestId('option');
  expect(option).toMatchSnapshot();
});

it('should render a hidden option', () => {
  render(<Option data-testid="option" hidden value="test" />);
  const option = screen.getByTestId('option');
  expect(option.classList).toContain('is-hidden');
});
