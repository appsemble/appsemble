import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { ImageComponent } from './index.js';

let originalDevicePixelRatio: PropertyDescriptor | undefined;
let originalIntersectionObserver: typeof window.IntersectionObserver;

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;

  readonly rootMargin = '';

  readonly thresholds = [0.1];

  readonly onIntersect: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.onIntersect = callback;
  }

  disconnect(): void {
    return undefined;
  }

  observe(target: Element): void {
    this.onIntersect([{ isIntersecting: true, target } as IntersectionObserverEntry], this);
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve(): void {
    return undefined;
  }
}

beforeEach(() => {
  originalDevicePixelRatio = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
  originalIntersectionObserver = window.IntersectionObserver;

  Object.defineProperty(window, 'IntersectionObserver', {
    configurable: true,
    value: MockIntersectionObserver,
  });
  Object.defineProperty(window, 'devicePixelRatio', {
    configurable: true,
    value: 1,
  });
});

afterEach(() => {
  if (originalDevicePixelRatio) {
    Object.defineProperty(window, 'devicePixelRatio', originalDevicePixelRatio);
  } else {
    Reflect.deleteProperty(window, 'devicePixelRatio');
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    configurable: true,
    value: originalIntersectionObserver,
  });
});

it('should request higher resolution Appsemble assets on high-DPR screens', async () => {
  Object.defineProperty(window, 'devicePixelRatio', {
    configurable: true,
    value: 3,
  });

  render(
    <ImageComponent
      alt="Course image"
      aspectRatio="9:16"
      id="course"
      size={64}
      src="http://localhost/api/apps/1/assets/course-image"
    />,
  );

  const image = screen.getByAltText('Course image');

  await waitFor(() => {
    expect(image.getAttribute('src')).toBe(
      'http://localhost/api/apps/1/assets/course-image?width=192&height=342',
    );
  });
});

it('should append dimensions to existing Appsemble asset query parameters', async () => {
  Object.defineProperty(window, 'devicePixelRatio', {
    configurable: true,
    value: 2,
  });

  render(
    <ImageComponent
      alt="Query image"
      id="query"
      size={48}
      src="http://localhost/api/apps/1/assets/course-image?foo=bar"
    />,
  );

  const image = screen.getByAltText('Query image');

  await waitFor(() => {
    expect(image.getAttribute('src')).toBe(
      'http://localhost/api/apps/1/assets/course-image?foo=bar&width=96&height=96',
    );
  });
});

it('should open the preview and not propagate the click by default', async () => {
  const parentClick = vi.fn();

  render(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div onClick={parentClick}>
      <ImageComponent alt="Preview image" id="preview" size={48} src="https://example.com/x.png" />
    </div>,
  );

  const button = screen.getByAltText('Preview image').closest('button') as HTMLButtonElement;
  await userEvent.click(button);

  expect(parentClick).not.toHaveBeenCalled();
  expect(document.querySelector('.modal')).not.toBeNull();
});

it('should let the click propagate and not open the preview when openPreview is false', async () => {
  const parentClick = vi.fn();

  render(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div onClick={parentClick}>
      <ImageComponent
        alt="Passthrough image"
        id="passthrough"
        openPreview={false}
        size={48}
        src="https://example.com/x.png"
      />
    </div>,
  );

  const button = screen.getByAltText('Passthrough image').closest('button') as HTMLButtonElement;
  await userEvent.click(button);

  expect(parentClick).toHaveBeenCalledOnce();
  expect(document.querySelector('.modal')).toBeNull();
});

it('should not modify external image URLs', async () => {
  Object.defineProperty(window, 'devicePixelRatio', {
    configurable: true,
    value: 3,
  });

  render(
    <ImageComponent
      alt="External image"
      id="external"
      size={64}
      src="https://example.com/image.png"
    />,
  );

  const image = screen.getByAltText('External image');

  await waitFor(() => {
    expect(image.getAttribute('src')).toBe('https://example.com/image.png');
  });
});
