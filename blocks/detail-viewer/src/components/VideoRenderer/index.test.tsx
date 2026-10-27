import { createExampleContext, remap, type Remapper } from '@appsemble/lang-sdk';
import { type BlockProps, Context } from '@appsemble/preact';
import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { VideoRenderer } from './index.js';

const context = createExampleContext(new URL('https://example.com/en/example'), 'en');
const block = {
  utils: {
    asset: (id: string) => id,
    formatMessage: (message: string) => message,
    remap: (remapper: Remapper, data: unknown) => remap(remapper, data, context),
  },
} as BlockProps;

it('names the thumbnail of a field without a video', () => {
  render(
    <Context.Provider value={block}>
      <VideoRenderer
        data={{ thumbnail: 'https://example.com/thumbnail.png' }}
        field={{ type: 'video', thumbnail: { prop: 'thumbnail' }, value: { prop: 'video' } }}
      />
    </Context.Provider>,
  );

  expect(screen.getByRole('button', { name: 'videoThumbnail' })).toBeDefined();
});

it('names the video player after the field label', () => {
  render(
    <Context.Provider value={block}>
      <VideoRenderer
        data={{ title: 'Introduction', video: 'abc123' }}
        field={{
          type: 'video',
          label: { prop: 'title' },
          platform: 'youtube',
          value: { prop: 'video' },
        }}
      />
    </Context.Provider>,
  );

  expect(screen.getByTitle('Introduction')).toBeDefined();
});

it.each([
  [undefined, 6],
  [2, 2],
] as const)('labels the video with a heading (labelLevel: %s)', (labelLevel, level) => {
  render(
    <Context.Provider value={block}>
      <VideoRenderer
        data={{ title: 'Introduction', video: 'intro.mp4' }}
        field={{ type: 'video', label: { prop: 'title' }, labelLevel, value: { prop: 'video' } }}
      />
    </Context.Provider>,
  );

  expect(screen.getByRole('heading', { level, name: 'Introduction' })).toBeDefined();
});

it('offers the configured captions for the video', () => {
  const { container } = render(
    <Context.Provider value={block}>
      <VideoRenderer
        data={{ captions: 'intro.vtt', video: 'intro.mp4' }}
        field={{ type: 'video', captions: { prop: 'captions' }, value: { prop: 'video' } }}
      />
    </Context.Provider>,
  );

  expect(container.querySelector('video track[kind="captions"]')?.getAttribute('src')).toBe(
    'intro.vtt',
  );
});

it('offers no captions when none are configured', () => {
  const { container } = render(
    <Context.Provider value={block}>
      <VideoRenderer
        data={{ video: 'intro.mp4' }}
        field={{ type: 'video', value: { prop: 'video' } }}
      />
    </Context.Provider>,
  );

  expect(container.querySelector('video track')).toBeNull();
});
