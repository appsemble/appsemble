import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { Context } from '@appsemble/preact';
import { type Action, type BootstrapParams } from '@appsemble/sdk';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { ListItem } from './index.js';

type BlockProps = BootstrapParams & { ready: (value: PromiseLike<void> | void) => void };

const defaultBootstrapParams = getDefaultBootstrapParams();

it('should render a list item component', async () => {
  const onClickMock = vi.fn();

  const onClick = Object.assign(
    // eslint-disable-next-line func-names,prefer-arrow-callback
    function <R>(data?: any, context?: Record<string, any>): Promise<R> {
      return onClickMock(data, context) as Promise<R>;
    },
    { type: 'link' as const, href: () => 'href' },
  );

  const props: BlockProps = {
    ...defaultBootstrapParams,
    parameters: {
      item: {
        header: {
          title: 'test',
        },
        content: {
          image: {
            file: 'https://en.wikipedia.org/wiki/Tux_%28mascot%29#/media/File:Tux.svg',
          },
        },
        footer: {
          dropdown: {
            options: [{ onClick: 'onClick' }],
          },
        },
      },
    },
    actions: {
      onClick,
      onDrop: { type: 'noop' } as Action,
    },
  };

  render(
    <Context.Provider value={props}>
      <ListItem dataTestId="list-item-test" index={0} item={{ id: 1 }} />
    </Context.Provider>,
  );

  const listItem = screen.getByTestId('list-item-test');
  expect(listItem).toMatchSnapshot();
  await userEvent.click(listItem);

  const image = listItem.getElementsByTagName('figure')[0].getElementsByTagName('button')[0];
  await userEvent.click(image);

  const dropdown = listItem
    .getElementsByClassName('dropdown-trigger')[0]
    .getElementsByClassName('div')[0];
  await userEvent.click(dropdown);

  expect(onClickMock).toHaveBeenCalledOnce();
});
