import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type BlockProps, Context } from '@appsemble/preact';
import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { Footer } from './bootstrap.js';

const defaultBootstrapParams = getDefaultBootstrapParams();

interface FooterData {
  copyright: string;
  destination: string;
  hidden: boolean;
  image: string;
  interactive: boolean;
  title: string;
}

const data: FooterData = {
  copyright: 'Copyright Appsemble',
  destination: '/en/destination',
  hidden: true,
  image: 'logo.png',
  interactive: false,
  title: 'Footer resources',
};

function setup({
  actions = {},
  columns = [],
}: {
  actions?: Record<string, any>;
  columns?: any[];
}): ReturnType<typeof render> & { ready: ReturnType<typeof vi.fn> } {
  const ready = vi.fn();
  const props = {
    ...defaultBootstrapParams,
    actions,
    data,
    parameters: {
      alignment: 'center',
      backgroundColor: 'dark',
      columns,
      copyright: { prop: 'copyright' },
      linkColor: 'primary',
      textColor: 'light',
    },
    ready,
    utils: {
      ...defaultBootstrapParams.utils,
      asset: (value: string) => `http://localhost/api/apps/1/assets/${value}`,
    },
  } as unknown as BlockProps;

  const result = render(
    <Context.Provider value={props}>
      <Footer {...props} />
    </Context.Provider>,
  );
  return { ...result, ready };
}

function createAction(type: 'link' | 'noop', dispatched: unknown[]): unknown {
  return Object.assign(
    (input: unknown) => {
      dispatched.push(input);
      return Promise.resolve();
    },
    type === 'link' ? { href: (input: FooterData) => input.destination, type } : { type },
  );
}

it('renders remapped footer content with semantic headings and configured colors', () => {
  const { container, ready } = setup({
    columns: [
      {
        items: [
          { icon: 'info', label: 'Visible information' },
          { hide: { prop: 'hidden' }, label: 'Hidden information' },
        ],
        title: { prop: 'title' },
        titleLevel: 3,
        type: 'links',
      },
    ],
  });

  expect(screen.getByRole('heading', { level: 3, name: 'Footer resources' })).toBeDefined();
  expect(screen.getByText('Visible information')).toBeDefined();
  expect(screen.queryByText('Hidden information')).toBeNull();
  expect(screen.getByText('Copyright Appsemble')).toBeDefined();
  expect(screen.queryByRole('button', { name: 'Visible information' })).toBeNull();
  expect(container.querySelector('footer')?.className).toContain('has-background-dark');
  expect(screen.getByText('Visible information').className).toContain('has-text-light');
  expect(ready).toHaveBeenCalledExactlyOnceWith();
});

it('delegates link actions to the action instead of navigating', async () => {
  const dispatched: unknown[] = [];
  const { container } = setup({
    actions: { openPage: createAction('link', dispatched) },
    columns: [
      { items: [{ label: 'Open page', onClick: 'openPage' }], title: 'Actions', type: 'links' },
    ],
  });
  const prevented: boolean[] = [];
  container.addEventListener('click', (event: Event) => prevented.push(event.defaultPrevented));

  const link = screen.getByRole('link', { name: 'Open page' });
  expect(link.getAttribute('href')).toBe('/en/destination');
  expect(link.className).toContain('has-text-primary');

  await userEvent.click(link);
  expect(dispatched).toStrictEqual([data]);
  expect(prevented).toStrictEqual([true]);
});

it('renders other actions as link styled buttons that dispatch current block data', async () => {
  const dispatched: unknown[] = [];
  setup({
    actions: { report: createAction('noop', dispatched) },
    columns: [
      {
        items: [{ icon: 'flag', label: 'Report issue', onClick: 'report' }],
        title: 'Actions',
        type: 'links',
      },
    ],
  });

  const button = screen.getByRole('button', { name: 'Report issue' });
  expect(screen.queryByRole('link', { name: 'Report issue' })).toBeNull();

  await userEvent.click(button);
  expect(dispatched).toStrictEqual([data]);
});

it('hides remapped images and renders non-interactive images when enlargement is disabled', () => {
  const { container } = setup({
    columns: [
      {
        image: { alt: 'Hidden logo', file: 'hidden.png', hide: { prop: 'hidden' } },
        type: 'image',
      },
      {
        image: { alt: 'Appsemble logo', enlarge: { prop: 'interactive' }, file: { prop: 'image' } },
        type: 'image',
      },
      {
        image: { alt: 'Remote logo', enlarge: false, file: 'https://example.com/logo.png' },
        type: 'image',
      },
      { image: { enlarge: false, file: 'static.png' }, type: 'image' },
    ],
  });

  expect(screen.queryByRole('img', { name: 'Hidden logo' })).toBeNull();
  expect(container.querySelectorAll('.column')).toHaveLength(3);
  expect(screen.getByRole('img', { name: 'Appsemble logo' }).getAttribute('src')).toBe(
    'http://localhost/api/apps/1/assets/logo.png',
  );
  expect(screen.getByRole('img', { name: 'Remote logo' }).getAttribute('src')).toBe(
    'https://example.com/logo.png',
  );
  expect(container.querySelector('img[src$="static.png"]')?.getAttribute('alt')).toBe('');
  expect(screen.queryByRole('button')).toBeNull();
});

it('opens and closes downloadable image enlargements', async () => {
  setup({
    columns: [
      {
        image: { alt: 'Appsemble logo', file: { prop: 'image' } },
        type: 'image',
      },
    ],
  });

  await userEvent.click(screen.getByRole('button', { name: 'Appsemble logo' }));
  expect(await screen.findByRole('button', { name: 'Download in HD' })).toBeDefined();

  await userEvent.click(screen.getByRole('button', { name: 'closeImage' }));
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: 'Download in HD' })).toBeNull();
  });
});

it('labels the enlargement of an image without alt text', () => {
  setup({ columns: [{ image: { file: 'https://example.com/logo.png' }, type: 'image' }] });

  expect(screen.getByRole('button', { name: 'enlargeImage' })).toBeDefined();
});
