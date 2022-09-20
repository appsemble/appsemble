import { createTestAction } from '../makeActions.js';

const navigate = import.meta.jest.fn();
import.meta.jest.mock('react-router-dom', () => ({
  ...(import.meta.jest.requireActual('react-router-dom') as any),
  useNavigate: () => navigate,
}));

beforeEach(() => {
  import.meta.jest.spyOn(window, 'open').mockImplementation();
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
      route: { params: { lang: 'da' }, pathname: '', pathnameBase: '', pattern: { path: '' } },
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
      app: { defaultPage: '', pages: [{ name: 'Page A', blocks: [] }] },
      definition: { type: 'link', to: 'Page A' },
      route: { params: { lang: 'da' }, pathname: '', pathnameBase: '', pattern: { path: '' } },
      navigate,
    });
    const link = action.href();
    expect(link).toBe('/da/page-a');
    const result = await action();
    expect(result).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/da/page-a', {});
  });

  it('should support links to sub-pages', async () => {
    const action = createTestAction({
      app: {
        defaultPage: '',
        pages: [{ name: 'Page A', type: 'tabs', tabs: [{ name: 'Subpage B', blocks: [] }] }],
      },
      definition: { type: 'link', to: ['Page A', 'Subpage B'] },
      route: { params: { lang: 'da' }, pathname: '', pathnameBase: '', pattern: { path: '' } },
      navigate,
    });
    const link = action.href();
    expect(link).toBe('/da/page-a/subpage-b');
    const result = await action();
    expect(result).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/da/page-a/subpage-b', {});
  });

  it('should support page parameters', async () => {
    const action = createTestAction({
      app: {
        defaultPage: '',
        pages: [{ name: 'Page A', blocks: [], parameters: ['id'] }],
      },
      definition: { type: 'link', to: 'Page A' },
      route: { params: { lang: 'da' }, pathname: '', pathnameBase: '', pattern: { path: '' } },
      navigate,
    });
    const link = action.href({ id: 3 });
    expect(link).toBe('/da/page-a/3');
    const result = await action({ id: 3 });
    expect(result).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith('/da/page-a/3', { id: 3 });
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
