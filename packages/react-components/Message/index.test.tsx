import { render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { expect, it } from 'vitest';

import { Message } from './index.js';
import { IconProvider } from '../IconProvider/index.js';

it.each([
  ['danger', 'fa-circle-xmark'],
  ['info', 'fa-circle-info'],
  ['success', 'fa-circle-check'],
  ['warning', 'fa-triangle-exclamation'],
] as const)('should show a status icon for %s messages', (color, className) => {
  const { container } = render(<Message color={color}>Saved</Message>);
  expect(container.querySelector(`.icon .${className}`)).not.toBeNull();
  expect(container.textContent).toBe('Saved');
});

it('should show the danger status icon in the danger color', () => {
  const { container } = render(<Message color="danger">Failed</Message>);
  expect(container.querySelector('.icon.has-text-danger')).not.toBeNull();
});

it.each(['info', 'success', 'warning'] as const)(
  'should show the %s status icon in the message text color',
  (color) => {
    const { container } = render(<Message color={color}>Saved</Message>);
    expect(container.querySelector('.icon')?.className).not.toContain('has-text-');
  },
);

it('should not show an icon for messages without a status color', () => {
  const { container } = render(<Message color="primary">Saved</Message>);
  expect(container.querySelector('.icon')).toBeNull();
});

it('should show the custom icon which overrides a status icon', () => {
  function Provider({ children }: { readonly children: ReactNode }): ReactNode {
    return (
      <IconProvider
        apiUrl="https://example.com"
        appId={42}
        registry={{ error: { asset: 'error-icon', overrides: ['circle-xmark'] } }}
      >
        {children}
      </IconProvider>
    );
  }

  const { container } = render(<Message color="danger">Failed</Message>, { wrapper: Provider });
  expect(container.querySelector('.icon img')?.getAttribute('src')).toBe(
    'https://example.com/api/apps/42/assets/error-icon',
  );
});
