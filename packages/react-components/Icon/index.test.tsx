import { fireEvent, render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { expect, it } from 'vitest';

import { Icon } from './index.js';
import { IconProvider } from '../IconProvider/index.js';

function Provider({ children }: { readonly children: ReactNode }): ReactNode {
  return (
    <IconProvider
      apiUrl="https://example.com"
      appId={42}
      registry={{ logo: { asset: 'company-logo' }, other: { asset: 'other-logo' } }}
    >
      {children}
    </IconProvider>
  );
}

it('should render Font Awesome icons outside a provider', () => {
  const { container } = render(<Icon icon="home" />);
  expect(container.innerHTML).toBe('<span class="icon"><i class="fas fa-home"></i></span>');
});

it('should apply size, color, and class names to Font Awesome icons', () => {
  const { container } = render(<Icon className="foo" color="primary" icon="home" size="large" />);
  expect(container.innerHTML).toBe(
    '<span class="icon is-large foo has-text-primary"><i class="fas fa-home fa-2x"></i></span>',
  );
});

it('should render registry references as empty boxes outside a provider', () => {
  const { container } = render(<Icon icon="icon:logo" />);
  expect(container.innerHTML).toBe('<span class="icon"></span>');
});

it('should render custom icons as images inside a provider', () => {
  const { container } = render(<Icon icon="icon:logo" size="medium" />, { wrapper: Provider });
  const img = container.querySelector('img')!;
  expect(img.getAttribute('alt')).toBe('');
  expect(img.getAttribute('src')).toBe('https://example.com/api/apps/42/assets/company-logo');
  expect(img.className).toBe('image');
  expect(img.parentElement?.className).toBe('icon is-medium asset');
});

it('should not apply theme colors to custom icons', () => {
  const { container } = render(<Icon color="primary" icon="icon:logo" />, { wrapper: Provider });
  expect(container.firstElementChild?.className).toBe('icon asset');
});

it('should render unknown registry keys as empty boxes', () => {
  const { container } = render(<Icon icon="icon:missing" />, { wrapper: Provider });
  expect(container.innerHTML).toBe('<span class="icon"></span>');
});

it('should keep an empty box when the image fails and reset when the URL changes', () => {
  const { container, rerender } = render(<Icon icon="icon:logo" />, { wrapper: Provider });
  fireEvent.error(container.querySelector('img')!);
  expect(container.innerHTML).toBe('<span class="icon asset"></span>');

  rerender(<Icon icon="icon:logo" />);
  expect(container.querySelector('img')).toBeNull();

  rerender(<Icon icon="icon:other" />);
  expect(container.querySelector('img')?.getAttribute('src')).toBe(
    'https://example.com/api/apps/42/assets/other-logo',
  );
});
