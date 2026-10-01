import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type BlockProps, Context } from '@appsemble/preact';
import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { ImageBlock } from './bootstrap.js';
import styles from './index.module.css';

const defaultBootstrapParams = getDefaultBootstrapParams();

function setup(
  parameters: Record<string, unknown>,
  container?: HTMLElement,
): ReturnType<typeof render> {
  const props = {
    ...defaultBootstrapParams,
    actions: {},
    events: { on: { data: () => true } },
    parameters: { alt: 'Team photo', ...parameters },
    ready() {
      // Do nothing
    },
    utils: {
      ...defaultBootstrapParams.utils,
      asset: (value: string) => `http://localhost/api/apps/1/assets/${value}`,
    },
  } as unknown as BlockProps;

  return render(
    <Context.Provider value={props}>
      <ImageBlock {...props} />
    </Context.Provider>,
    { container },
  );
}

it('renders the image without a button when fullscreen is off', () => {
  setup({ url: 'photo.jpg' });

  expect(screen.getByRole('img', { name: 'Team photo' })).toBeDefined();
  expect(screen.queryByRole('button')).toBeNull();
});

it('renders the image as a button when fullscreen is on', () => {
  setup({ fullscreen: true, url: 'photo.jpg' });

  expect(screen.getByRole('button', { name: 'Team photo' })).toBeDefined();
});

function getImageStyle(): CSSStyleDeclaration {
  return getComputedStyle(screen.getByRole('img', { name: 'Team photo' }));
}

// The placeholder color uses modern color syntax, which jsdom does not compute.
it('shows the placeholder background only when no image is set', () => {
  const { unmount } = setup({});
  expect(screen.getByRole('img', { name: 'Team photo' }).classList).toContain(styles.placeholder);
  unmount();

  setup({ url: 'photo.jpg' });
  expect(screen.getByRole('img', { name: 'Team photo' }).classList).not.toContain(
    styles.placeholder,
  );
});

it('does not show the placeholder before a set image', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const observer = new MutationObserver(() => null);
  observer.observe(container, { attributeFilter: ['src'], subtree: true });

  setup({ url: 'photo.jpg' }, container);

  expect(observer.takeRecords()).toStrictEqual([]);
  expect(screen.getByRole('img', { name: 'Team photo' }).getAttribute('src')).toBe(
    'http://localhost/api/apps/1/assets/photo.jpg',
  );
});

it('applies the default size on the first render', () => {
  setup({});

  expect(getImageStyle().width).toBe('250px');
  expect(getImageStyle().height).toBe('250px');
  expect(getImageStyle().borderRadius).toBe('');
});

it('rounds the image when rounded is on', () => {
  setup({ rounded: true });

  expect(getImageStyle().borderRadius).toBe('50%');
});

it('fills the block width without pixel dimensions when fill is on', () => {
  setup({ fill: true, height: 100, url: 'photo.jpg', width: 100 });

  expect(getImageStyle().width).toBe('100%');
  expect(getImageStyle().height).toBe('');
});

it.each([
  ['left', 'flex-start'],
  ['center', 'center'],
  ['right', 'flex-end'],
])('aligns the image to the %s', (alignment, expected) => {
  const { container } = setup({ alignment, url: 'photo.jpg' });

  expect(getComputedStyle(container.firstElementChild!).justifyContent).toBe(expected);
});
