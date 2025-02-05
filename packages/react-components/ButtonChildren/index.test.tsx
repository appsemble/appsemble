import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { ButtonChildren } from './index.js';

it('should render every child of the component', () => {
  render(
    <div role="tab">
      <ButtonChildren>
        <div>test div</div>
        <button type="button">test button</button>
        <input placeholder="test-input" />
      </ButtonChildren>
    </div>,
  );
  const buttonChildren = screen.getByRole('tab');
  expect(buttonChildren).toMatchSnapshot();
});

it('should render an icon', () => {
  render(
    <div role="tab">
      <ButtonChildren icon="home" iconPosition="left">
        <div>test div</div>
      </ButtonChildren>
    </div>,
  );
  const icon = screen.getByRole('tab');
  expect(icon).toMatchSnapshot();
});
