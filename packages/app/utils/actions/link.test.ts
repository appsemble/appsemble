import { RouteComponentProps } from 'react-router-dom';

import { createTestAction } from '../makeActions';

let history: RouteComponentProps['history'];

beforeEach(() => {
  jest.spyOn(window, 'open').mockImplementation();
  history = {
    action: null,
    block: null,
    createHref: jest.fn(),
    go: jest.fn(),
    goBack: jest.fn(),
    goForward: jest.fn(),
    length: 0,
    listen: jest.fn(),
    location: null,
    push: jest.fn(),
    replace: jest.fn(),
  };
});

describe('link', () => {
  it('should support external links', async () => {
    const action = createTestAction({
      app: { defaultPage: '', pages: [] },
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
      app: { defaultPage: '', pages: [{ name: 'Page A', blocks: [] }] },
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
      app: { defaultPage: '', pages: [{ name: 'Page A', blocks: [] }] },
      definition: { type: 'link', to: '/Login' },
      route: { isExact: false, params: { lang: 'da' }, path: '', url: '' },
      history,
    });
    const link = action.href();
    expect(link).toBe('/da/Login');
    const result = await action();
    expect(result).toBeUndefined();
    expect(history.push).toHaveBeenCalledWith('/da/Login', {});
  });

  it('should support links to pages', async () => {
    const action = createTestAction({
      app: { defaultPage: '', pages: [{ name: 'Page A', blocks: [] }] },
      definition: { type: 'link', to: 'Page A' },
      route: { isExact: false, params: { lang: 'da' }, path: '', url: '' },
      history,
    });
    const link = action.href();
    expect(link).toBe('/da/page-a');
    const result = await action();
    expect(result).toBeUndefined();
    expect(history.push).toHaveBeenCalledWith('/da/page-a', {});
  });

  it('should support links to sub-pages', async () => {
    const action = createTestAction({
      app: {
        defaultPage: '',
        pages: [{ name: 'Page A', type: 'tabs', tabs: [{ name: 'Subpage B', blocks: [] }] }],
      },
      definition: { type: 'link', to: ['Page A', 'Subpage B'] },
      route: { isExact: false, params: { lang: 'da' }, path: '', url: '' },
      history,
    });
    const link = action.href();
    expect(link).toBe('/da/page-a/subpage-b');
    const result = await action();
    expect(result).toBeUndefined();
    expect(history.push).toHaveBeenCalledWith('/da/page-a/subpage-b', {});
  });

  it('should support page parameters', async () => {
    const action = createTestAction({
      app: {
        defaultPage: '',
        pages: [{ name: 'Page A', blocks: [], parameters: ['id'] }],
      },
      definition: { type: 'link', to: 'Page A' },
      route: { isExact: false, params: { lang: 'da' }, path: '', url: '' },
      history,
    });
    const link = action.href({ id: 3 });
    expect(link).toBe('/da/page-a/3');
    const result = await action({ id: 3 });
    expect(result).toBeUndefined();
    expect(history.push).toHaveBeenCalledWith('/da/page-a/3', { id: 3 });
  });
});

describe('link.back', () => {
  it('should go back in history', async () => {
    const action = createTestAction({
      definition: { type: 'link.back' },
      history,
    });
    const result = await action({ input: 'data' });
    expect(history.goBack).toHaveBeenCalledWith();
    expect(result).toStrictEqual({ input: 'data' });
  });
});

describe('link.next', () => {
  it('should go forward in history', async () => {
    const action = createTestAction({
      definition: { type: 'link.next' },
      history,
    });
    const result = await action({ input: 'data' });
    expect(history.goForward).toHaveBeenCalledWith();
    expect(result).toStrictEqual({ input: 'data' });
  });
});
