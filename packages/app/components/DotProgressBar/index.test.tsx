import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { DotProgressBar } from './index.js';

describe('DotProgressBar', () => {
  it('should announce the current step of the flow', () => {
    render(
      <IntlProvider locale="en">
        <DotProgressBar active={1} amount={4} />
      </IntlProvider>,
    );

    expect(
      screen.getByRole('progressbar', { name: 'Progress' }).getAttribute('aria-valuetext'),
    ).toBe('Step 2 of 4');
  });
});
