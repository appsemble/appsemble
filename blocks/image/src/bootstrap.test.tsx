import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type BlockProps, Context } from '@appsemble/preact';
import { createEvent, fireEvent, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { type VNode } from 'preact';
import { afterEach, expect, it, vi } from 'vitest';

import { ImageBlock } from './bootstrap.js';
import styles from './index.module.css';

const defaultBootstrapParams = getDefaultBootstrapParams();

afterEach(() => {
  vi.unstubAllGlobals();
});

// The preact fireEvent wrapper renames `change` to `input` once a `preact/compat` element was
// rendered, so the file input needs a real change event.
function selectFiles(files: File[]): void {
  const input = screen.getByLabelText('changeImage').querySelector('input')!;
  fireEvent(input, createEvent.change(input, { target: { files } }));
}

function createProps(
  parameters: Record<string, unknown>,
  actions: Record<string, unknown> = {},
): BlockProps {
  return {
    ...defaultBootstrapParams,
    actions,
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
}

function renderBlock(props: BlockProps): VNode {
  return (
    <Context.Provider value={props}>
      <ImageBlock {...props} />
    </Context.Provider>
  );
}

function setup(
  parameters: Record<string, unknown>,
  container?: HTMLElement,
  actions: Record<string, unknown> = {},
): ReturnType<typeof render> {
  return render(renderBlock(createProps(parameters, actions)), { container });
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

it('shows the default image in fullscreen when no image is set', async () => {
  setup({ defaultImage: 'placeholder.png', fullscreen: true });

  await userEvent.click(screen.getByRole('button', { name: 'Team photo' }));

  const sources = screen
    .getAllByRole('img', { name: 'Team photo' })
    .map((img) => img.getAttribute('src'));
  expect(sources).toStrictEqual(['placeholder.png', 'placeholder.png']);
});

it('keeps the current image when the file selection is cancelled', () => {
  const onChange = vi.fn();
  setup({ input: true, url: 'photo.jpg' }, undefined, { onChange });

  selectFiles([]);

  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByRole('img', { name: 'Team photo' }).getAttribute('src')).toBe(
    'http://localhost/api/apps/1/assets/photo.jpg',
  );
});

it('revokes the preview URL when the image url changes', () => {
  const previewUrl = 'blob:http://localhost/preview';
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => previewUrl),
    revokeObjectURL: vi.fn(),
  });
  const { rerender } = setup({ input: true, url: 'photo.jpg' }, undefined, { onChange: vi.fn() });
  const file = new File(['image'], 'photo.png', { type: 'image/png' });
  selectFiles([file]);
  expect(screen.getByRole('img', { name: 'Team photo' }).getAttribute('src')).toBe(previewUrl);

  rerender(renderBlock(createProps({ input: true, url: 'other.jpg' }, { onChange: vi.fn() })));

  expect(URL.revokeObjectURL).toHaveBeenCalledWith(previewUrl);
  expect(screen.getByRole('img', { name: 'Team photo' }).getAttribute('src')).toBe(
    'http://localhost/api/apps/1/assets/other.jpg',
  );
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
