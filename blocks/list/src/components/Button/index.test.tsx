import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { Context } from '@appsemble/preact';
import { type Action } from '@appsemble/sdk';
import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { ButtonComponent } from './index.js';

it('uses the remapped action title as its accessible name', () => {
  render(
    <Context.Provider
      value={{
        ...getDefaultBootstrapParams(),
        parameters: { item: {} },
        actions: { onClick: { type: 'noop' } as Action, onDrop: { type: 'noop' } as Action },
      }}
    >
      <ButtonComponent
        field={{ icon: 'play', label: 'Run', title: { prop: 'actionTitle' } }}
        index={0}
        item={{ id: 1, actionTitle: 'Run evening scene' }}
      />
    </Context.Provider>,
  );

  expect(screen.getByRole('button', { name: 'Run evening scene' })).toBeDefined();
});

it('keeps the visible label accessible when no title is configured', () => {
  render(
    <Context.Provider
      value={{
        ...getDefaultBootstrapParams(),
        parameters: { item: {} },
        actions: { onClick: { type: 'noop' } as Action, onDrop: { type: 'noop' } as Action },
      }}
    >
      <ButtonComponent field={{ icon: 'play', label: 'Run' }} index={0} item={{ id: 1 }} />
    </Context.Provider>,
  );

  expect(screen.getByRole('button', { name: 'Run' })).toBeDefined();
});
