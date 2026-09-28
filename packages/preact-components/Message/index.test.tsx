import { type IconRegistry } from '@appsemble/lang-sdk';
import { type BlockProps, Context } from '@appsemble/preact';
import { fa, resolveIcon } from '@appsemble/web-utils';
import { render, screen } from '@testing-library/preact';
import { type ComponentChildren, type VNode } from 'preact';
import { expect, it } from 'vitest';

import { Message } from './index.js';

const registry: IconRegistry = {
  error: { asset: 'error-icon', overrides: ['circle-exclamation'] },
};

const block = {
  utils: {
    fa,
    resolveIcon: (reference: string) =>
      resolveIcon(reference, registry, (asset) => `https://example.com/assets/${asset}`),
  },
} as BlockProps;

function Provider({ children }: { readonly children: ComponentChildren }): VNode {
  return <Context.Provider value={block}>{children}</Context.Provider>;
}

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
    { wrapper: Provider },
  );
  const message = screen.getByTestId('message-comp');
  expect(message.classList).toContain('is-success');
});

it.each([
  ['info', 'fa-circle-info'],
  ['success', 'fa-circle-check'],
  ['warning', 'fa-triangle-exclamation'],
] as const)('should show a status icon for %s messages', (color, className) => {
  render(
    <Message color={color}>
      <span>Saved</span>
    </Message>,
    { wrapper: Provider },
  );
  const message = screen.getByTestId('message-comp');
  expect(message.querySelector(`.icon .${className}`)).not.toBeNull();
  expect(message.textContent).toBe('Saved');
});

it('should not show an icon for messages without a status color', () => {
  render(
    <Message color="primary">
      <span>Saved</span>
    </Message>,
  );
  expect(screen.getByTestId('message-comp').querySelector('.icon')).toBeNull();
});

it('should show the custom icon which overrides a status icon', () => {
  render(
    <Message color="danger">
      <span>Failed</span>
    </Message>,
    { wrapper: Provider },
  );
  expect(screen.getByTestId('message-comp').querySelector('.icon img')?.getAttribute('src')).toBe(
    'https://example.com/assets/error-icon',
  );
});
