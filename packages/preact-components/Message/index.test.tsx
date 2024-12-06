import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { Message } from './index.js';

it('should render a message with appropriate inner text', () => {
  render(
    <Message>
      <div>Random text here</div>
    </Message>,
  );
  const message = screen.getByTestId('message-comp').textContent;
  expect(message).toBe('Random text here');
});

it('should render a message with the right class name', () => {
  render(
    <Message color="success">
      <div>Random text here</div>
    </Message>,
  );
  const message = screen.getByTestId('message-comp');
  expect(message.classList).toContain('is-success');
});
