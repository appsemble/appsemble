import { IntlMessageFormat } from 'intl-messageformat';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestAction } from '../makeActions.js';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...((await vi.importActual('react-router-dom')) as typeof import('react-router-dom')),
  useNavigate: () => navigate,
}));

beforeEach(() => {
  vi.spyOn(window, 'open').mockImplementation(() => window);
});

describe('link', () => {
  it('should support external links', async () => {
    const action = createTestAction({
      appDefinition: { name: 'Test App', defaultPage: '', pages: [] },
      definition: { type: 'link', to: 'https://example.com' },
    });
    const link = action.href();
    expect(link).toBe('https://example.com');
    const result = await action();
    expect(result).toBeUndefined();
    expect(window.open).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('should support external links from input data', async () => {
    const action = createTestAction({
      appDefinition: { name: 'Test App', defaultPage: '', pages: [{ name: 'Page A', blocks: [] }] },
      definition: { type: 'link', to: 'Page A' },
    });
    const link = action.href('https://example.com');
    expect(link).toBe('https://example.com');
    const result = await action('https://example.com');
    expect(result).toBeUndefined();
    expect(window.open).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('should support links to default app pages', async () => {
    const action = createTestAction({
      appDefinition: { name: 'Test App', defaultPage: '', pages: [{ name: 'Page A', blocks: [] }] },
      definition: { type: 'link', to: '/Login' },
      params: { lang: 'da' },
      navigate,
    });
    const link = action.href();
    expect(link).toBe('/da/Login');
    const result = await action();
    expect(result).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/da/Login', {});
  });

  it('should support links to pages', async () => {
    const action = createTestAction({
      appDefinition: { name: 'Test App', defaultPage: '', pages: [{ name: 'Page A', blocks: [] }] },
      definition: { type: 'link', to: 'Page A' },
      params: { lang: 'da' },
      navigate,
    });
    const link = action.href();
    expect(link).toBe('/da/page-a');
    const result = await action();
    expect(result).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/da/page-a', {});
  });

  it('should support links to pages inside container pages', async () => {
    const action = createTestAction({
      appDefinition: {
        name: 'Test App',
        defaultPage: '',
        pages: [
          { name: 'Container Page', type: 'container', pages: [{ name: 'Page A', blocks: [] }] },
        ],
      },
      definition: { type: 'link', to: 'Page A' },
      params: { lang: 'da' },
      navigate,
    });

    const link = action.href();
    expect(link).toBe('/da/page-a');
    const result = await action();
    expect(result).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/da/page-a', {});
  });

  it('should support links to translatable pages inside container pages', async () => {
    const appMessages: Record<string, string> = {
      'pages.page-a': 'Side A',
    };

    const action = createTestAction({
      appDefinition: {
        name: 'Test App',
        defaultPage: '',
        pages: [
          { name: 'Container Page', type: 'container', pages: [{ name: 'Page A', blocks: [] }] },
        ],
      },
      definition: { type: 'link', to: 'Page A' },
      params: { lang: 'da' },
      // @ts-expect-error 2538 type undefined cannot be used as an index type
      getAppMessage: ({ id }) => new IntlMessageFormat(appMessages[id]),
      navigate,
    });

    const link = action.href();
    expect(link).toBe('/da/side-a');
    const result = await action();
    expect(result).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/da/side-a', {});
  });

  it('should support links to translatable pages', async () => {
    const appMessages: Record<string, string> = {
      'pages.page-a': 'Side A',
    };

    const action = createTestAction({
      appDefinition: { name: 'Test App', defaultPage: '', pages: [{ name: 'Page A', blocks: [] }] },
      definition: { type: 'link', to: 'Page A' },
      params: { lang: 'da' },
      // @ts-expect-error 2538 type undefined cannot be used as an index type
      getAppMessage: ({ id }) => new IntlMessageFormat(appMessages[id]),
      navigate,
    });

    const link = action.href();
    expect(link).toBe('/da/side-a');
    const result = await action();
    expect(result).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/da/side-a', {});
  });

  it('should support links to sub-pages inside container pages', async () => {
    const action = createTestAction({
      appDefinition: {
        name: 'Test App',
        defaultPage: '',
        pages: [
          {
            name: 'Container Page',
            type: 'container',
            pages: [{ name: 'Page A', type: 'tabs', tabs: [{ name: 'Subpage B', blocks: [] }] }],
          },
        ],
      },
      definition: { type: 'link', to: ['Page A', 'Subpage B'] },
      params: { lang: 'da' },
      navigate,
    });
    const link = action.href();
    expect(link).toBe('/da/page-a/subpage-b');
    const result = await action();
    expect(result).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/da/page-a/subpage-b', {});
  });

  it('should support links to sub-pages', async () => {
    const action = createTestAction({
      appDefinition: {
        name: 'Test App',
        defaultPage: '',
        pages: [{ name: 'Page A', type: 'tabs', tabs: [{ name: 'Subpage B', blocks: [] }] }],
      },
      definition: { type: 'link', to: ['Page A', 'Subpage B'] },
      params: { lang: 'da' },
      navigate,
    });
    const link = action.href();
    expect(link).toBe('/da/page-a/subpage-b');
    const result = await action();
    expect(result).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/da/page-a/subpage-b', {});
  });

  it('should support links to translatable sub-pages', async () => {
    const appMessages: Record<string, string> = {
      'pages.page-a.tabs.0': 'Underside B',
    };

    const action = createTestAction({
      appDefinition: {
        name: 'Test App',
        defaultPage: '',
        pages: [{ name: 'Page A', type: 'tabs', tabs: [{ name: 'Subpage B', blocks: [] }] }],
      },
      definition: { type: 'link', to: ['Page A', 'Subpage B'] },
      params: { lang: 'da' },
      getAppMessage: ({ defaultMessage, id }) =>
        // @ts-expect-error 2538 type undefined cannot be used as an index type
        new IntlMessageFormat(appMessages[id] ?? defaultMessage),
      navigate,
    });
    const link = action.href();
    expect(link).toBe('/da/page-a/underside-b');
    const result = await action();
    expect(result).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/da/page-a/underside-b', {});
  });

  it('should support page parameters', async () => {
    const action = createTestAction({
      appDefinition: {
        name: 'Test App',
        defaultPage: '',
        pages: [{ name: 'Page A', blocks: [], parameters: ['id'] }],
      },
      definition: { type: 'link', to: 'Page A' },
      params: { lang: 'da' },
      navigate,
    });
    const link = action.href({ id: 3 });
    expect(link).toBe('/da/page-a/3');
    const result = await action({ id: 3 });
    expect(result).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/da/page-a/3', { id: 3 });
  });

  it('should support links to tabs page with page parameters', async () => {
    const action = createTestAction({
      appDefinition: {
        name: 'Test App',
        defaultPage: '',
        pages: [
          {
            name: 'Page A',
            type: 'tabs',
            tabs: [{ name: 'Subpage B', blocks: [] }],
            parameters: ['id'],
          },
        ],
      },
      definition: { type: 'link', to: 'Page A' },
      params: { lang: 'da' },
      navigate,
    });
    const link = action.href({ id: 3 });
    expect(link).toBe('/da/page-a/subpage-b/3');
    const result = await action({ id: 3 });
    expect(result).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/da/page-a/subpage-b/3', { id: 3 });
  });

  it('should support links to sub-pages with parent tabs page parameters', async () => {
    const action = createTestAction({
      appDefinition: {
        name: 'Test App',
        defaultPage: '',
        pages: [
          {
            name: 'Page A',
            type: 'tabs',
            tabs: [{ name: 'Subpage B', blocks: [] }],
            parameters: ['id'],
          },
        ],
      },
      definition: { type: 'link', to: ['Page A', 'Subpage B'] },
      params: { lang: 'da' },
      navigate,
    });
    const link = action.href({ id: 3 });
    expect(link).toBe('/da/page-a/subpage-b/3');
    const result = await action({ id: 3 });
    expect(result).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/da/page-a/subpage-b/3', { id: 3 });
  });

  it('should support dynamic links', async () => {
    const action = createTestAction({
      appDefinition: {
        name: 'Test App',
        defaultPage: '',
        pages: [{ name: 'Page A', type: 'tabs', tabs: [{ name: 'Subpage B', blocks: [] }] }],
      },
      definition: {
        type: 'link',
        to: [{ 'object.from': { linkTo: 'Page A' } }, { prop: 'linkTo' }],
      },
      params: { lang: 'da' },
      navigate,
    });
    const link = action.href();
    expect(link).toBe('/da/page-a/subpage-b');
    const result = await action();
    expect(result).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/da/page-a/subpage-b', {});
  });
});

describe('link.back', () => {
  it('should go back in history', async () => {
    const action = createTestAction({
      definition: { type: 'link.back' },
      navigate,
    });
    const result = await action({ input: 'data' });
    expect(navigate).toHaveBeenCalledWith(-1);
    expect(result).toStrictEqual({ input: 'data' });
  });
});

describe('link.next', () => {
  it('should go forward in history', async () => {
    const action = createTestAction({
      definition: { type: 'link.next' },
      navigate,
    });
    const result = await action({ input: 'data' });
    expect(navigate).toHaveBeenCalledWith(1);
    expect(result).toStrictEqual({ input: 'data' });
  });
});
