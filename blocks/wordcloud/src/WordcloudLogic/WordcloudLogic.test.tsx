// @vitest-environment jsdom

import { type BlockProps, Context } from '@appsemble/preact';
import { render, screen, within } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { WordcloudLogic } from './WordcloudLogic.js';

// Jsdom can't draw on a canvas, so the wordcloud is placed without drawing it.
vi.mock('wordcloud', () => ({ default: Object.assign(() => null, { isSupported: true }) }));

function renderWordcloud(description?: string): void {
  const block = {
    parameters: { description: description && { static: description } },
    utils: {
      formatMessage: (message: string, args?: Record<string, unknown>) =>
        args ? `${args.word} ${args.count}` : message,
      remap: (remapper?: { static: string }) => remapper?.static,
    },
  } as unknown as BlockProps;

  render(
    <Context.Provider value={block}>
      <WordcloudLogic
        options={{}}
        shape="circle"
        words={['tea', 'coffee', 'lunch', 'lunch', 'coffee', 'lunch']}
      />
    </Context.Provider>,
  );
}

it('names the wordcloud image and lists the words by frequency', () => {
  renderWordcloud('Popular tags');

  expect(screen.getByRole('img', { name: 'Popular tags' })).toBeDefined();
  expect(
    within(screen.getByRole('list', { name: 'Popular tags' }))
      .getAllByRole('listitem')
      .map((item) => item.textContent),
  ).toStrictEqual(['lunch 3', 'coffee 2', 'tea 1']);
});

it('gives the wordcloud a generic name without a description', () => {
  renderWordcloud();

  expect(screen.getByRole('img', { name: 'wordcloud' })).toBeDefined();
});
