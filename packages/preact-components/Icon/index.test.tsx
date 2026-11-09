import { type BlockProps, Context } from '@appsemble/preact';
import { fa, getIconAsset, resolveIcon } from '@appsemble/web-utils';
import { fireEvent, render } from '@testing-library/preact';
import { type ComponentChildren, type VNode } from 'preact';
import { expect, it } from 'vitest';

import { Icon } from './index.js';

const registry = { logo: { asset: 'company-logo' }, other: { asset: 'other-logo' } };

const block = {
  utils: {
    fa,
    resolveIcon: (reference: string) =>
      resolveIcon(reference, registry, (asset) => ({
        type: 'asset',
        url: `https://example.com/assets/${asset}`,
      })),
  },
} as BlockProps;

function Provider({ children }: { readonly children: ComponentChildren }): VNode {
  return <Context.Provider value={block}>{children}</Context.Provider>;
}

it('should render Font Awesome icons like before', () => {
  const { container } = render(<Icon className="foo" icon="home" size="large" />, {
    wrapper: Provider,
  });
  expect(container.innerHTML).toBe(
    '<span class="icon is-large foo"><i class="fas fa-home fa-2x"></i></span>',
  );
});

it('should render custom icons as images', () => {
  const { container } = render(<Icon icon="icon:logo" iconSize="3x" />, { wrapper: Provider });
  const img = container.querySelector('img')!;
  expect(img.getAttribute('alt')).toBe('');
  expect(img.getAttribute('src')).toBe('https://example.com/assets/company-logo');
  expect(img.className).toBe('image');
});

it('should render invalid references as empty boxes', () => {
  const { container } = render(<Icon icon="icon:missing" />, { wrapper: Provider });
  expect(container.innerHTML).toBe('<span class="icon"></span>');
});

it('should keep an empty box when the image fails and reset when the URL changes', () => {
  const { container, rerender } = render(<Icon icon="icon:logo" />, { wrapper: Provider });
  fireEvent.error(container.querySelector('img')!);
  expect(container.innerHTML).toBe('<span class="icon asset"></span>');

  rerender(<Icon icon="icon:other" />);
  expect(container.querySelector('img')?.getAttribute('src')).toBe(
    'https://example.com/assets/other-logo',
  );
});

it('should load the name URL when the id URL fails', () => {
  const idBlock = {
    utils: {
      fa,
      resolveIcon: (reference: string) =>
        resolveIcon(reference, registry, (asset) =>
          getIconAsset('https://example.com', 42, asset, { 'company-logo': '0f2793d9' }),
        ),
    },
  } as BlockProps;
  const { container } = render(
    <Context.Provider value={idBlock}>
      <Icon icon="icon:logo" />
    </Context.Provider>,
  );
  const img = container.querySelector('img')!;
  expect(img.getAttribute('src')).toBe('https://example.com/api/apps/42/assets/0f2793d9');

  fireEvent.error(img);
  expect(container.querySelector('img')?.getAttribute('src')).toBe(
    'https://example.com/api/apps/42/assets/company-logo',
  );

  fireEvent.error(container.querySelector('img')!);
  expect(container.innerHTML).toBe('<span class="icon asset"></span>');
});
