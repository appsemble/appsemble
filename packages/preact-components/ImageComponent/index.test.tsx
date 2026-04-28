import { render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, expect, it } from 'vitest';

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
