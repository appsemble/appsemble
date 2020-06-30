import { attach, Remapper } from '@appsemble/sdk';
import equal from 'fast-deep-equal';
import { h } from 'mini-jsx';

import styles from './index.css';

interface Item {
  [key: string]: unknown;
}

type Data = Item | Item[];

attach(
  ({
    events,
    parameters: {
      buttonLabel = 'Refresh',
      color = 'dark',
      id = 'id',
      newMessage = 'New data is available',
      updatedMessage = 'Data has been changed',
    },
    utils,
  }) => {
    let oldData: Data;
    let pendingData: Data;
    let messageText: HTMLElement;
    let messageBody: HTMLElement;

    const setPending = (newData: Data, message: Remapper, count: number): void => {
      pendingData = newData;
      messageText.textContent = utils.remap(message, { count });
      messageBody.classList.remove(styles.hidden, 'py-0');
    };

    const onClick = (): void => {
      messageBody.classList.add(styles.hidden, 'py-0');
      oldData = pendingData;
      events.emit.data(pendingData);
    };

    events.on.data((newData: Data) => {
      // Just emit the data if there is nothing to compara against.
      if (oldData === undefined) {
        oldData = newData;
        events.emit.data(newData);
        return;
      }

      // If we are comparing non-array items, just check for equality.
      if (!Array.isArray(oldData) || !Array.isArray(newData)) {
        if (!equal(oldData, newData)) {
          setPending(newData, updatedMessage, 1);
        }
        return;
      }

      // Zip old and new items for easy comparison. Use the new data as the source of truth. The id
      // parameter is used to make them represent the same entity.
      const zipped = newData.map<[Item, Item]>((newItem) => {
        const oldItem = (oldData as Item[]).find((o) => o[id] === newItem[id]);
        return [oldItem, newItem];
      });

      // Count new items where nothing matches the id of an old one.
      const newCount = zipped.filter(([oldItem]) => !oldItem).length;
      if (newCount) {
        setPending(newData, newMessage, newCount);
        return;
      }

      // If there are no new items, check is any items have been updated using deep equality..
      const diffCount = zipped.filter(([oldItem, newItem]) => !equal(oldItem, newItem)).length;
      if (diffCount) {
        setPending(newData, updatedMessage, diffCount);
      }
    });

    return (
      <div className={`message is-${color}`}>
        <div
          ref={(node) => {
            messageBody = node;
          }}
          className={`message-body is-clipped is-flex py-0 ${styles.messageBody} ${styles.hidden}`}
        >
          <span
            ref={(node) => {
              messageText = node;
            }}
          />
          <button className={`button is-${color}`} onclick={onClick} type="button">
            {utils.remap(buttonLabel, null)}
          </button>
        </div>
      </div>
    );
  },
);
