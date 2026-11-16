import { render, screen } from '@testing-library/preact';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import { Loader } from './index.js';

it('should announce that it is loading', () => {
  render(
    <IntlProvider locale="en">
      <Loader />
    </IntlProvider>,
  );

  expect(screen.getByRole('status').textContent).toBe('Loading');
});

it('should render while the messages load', () => {
  render(<Loader />);

  expect(screen.getByRole('status').textContent).toBe('');
});
