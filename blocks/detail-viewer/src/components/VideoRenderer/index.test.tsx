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
