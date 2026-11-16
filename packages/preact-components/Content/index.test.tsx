import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { Content } from './index.js';

it('should render a div with extra attributes', () => {
  render(
    <Content className="foo" data-testid="content">
      Hello
    </Content>,
  );
  const content = screen.getByTestId('content');
  expect(content.tagName).toBe('DIV');
  expect(content.classList.contains('foo')).toBe(true);
  expect(content.textContent).toBe('Hello');
});

it('should render a main landmark', () => {
  render(<Content main>Hello</Content>);
  expect(screen.getByRole('main').textContent).toBe('Hello');
});

it('should add padding', () => {
  render(
    <Content data-testid="content" padding>
      Hello
    </Content>,
  );
  const content = screen.getByTestId('content');
  expect(content.classList.contains('px-3')).toBe(true);
  expect(content.classList.contains('py-3')).toBe(true);
});
