import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type BlockProps, Context } from '@appsemble/preact';
import { type Action } from '@appsemble/sdk';
import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { Card } from './index.js';

function action(type: Action['type']): Action {
  return Object.assign(() => Promise.resolve([]), { type }) as unknown as Action;
}

function renderCard(status: string): void {
  const props = {
    ...getDefaultBootstrapParams(),
    actions: {
      onAvatarClick: action('noop'),
      onButtonClick: action('noop'),
      onLoadReply: action('resource.query'),
      onSubmitReply: action('resource.create'),
    },
    parameters: {},
  } as unknown as BlockProps;

  render(
    <Context.Provider value={props}>
      <Card content={{ id: 1, photos: [], status }} onUpdate={() => null} />
    </Context.Provider>,
  );
}

it.each([
  ['open', 'statusOpen'],
  ['in-behandeling', 'statusInProgress'],
  ['opgelost', 'statusResolved'],
  ['unknown', 'avatar'],
])('should name the avatar after the %s status', (status, name) => {
  renderCard(status);

  expect(screen.getByRole('button', { name })).toBeDefined();
});

it('should label the reply input and submit button', () => {
  renderCard('open');

  expect(screen.getByRole('textbox', { name: 'replyLabel' })).toBeDefined();
  expect(screen.getByRole('button', { name: 'sendReply' })).toBeDefined();
});
