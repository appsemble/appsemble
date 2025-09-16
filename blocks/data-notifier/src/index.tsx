import { bootstrap, type Messages } from '@appsemble/sdk';
import equal from 'fast-deep-equal';

import styles from './index.module.css';

type Item = Record<string, unknown>;

type Data = Item | Item[];

bootstrap(({ events, parameters: { color = 'dark', id = 'id' }, utils }) => {
  let oldData: Data;
  let pendingData: Data;
  let message: HTMLElement;
  let messageText: HTMLElement;
  let messageBody: HTMLElement;

  const setPending = (newData: Data, msg: keyof Messages, count: number): void => {
    pendingData = newData;
    messageText.textContent = utils.formatMessage(msg, { count });
    messageBody.classList.remove(styles.hidden, 'py-0');
    message.classList.add('my-3');
  };

  const onClick = (): void => {
    messageBody.classList.add(styles.hidden, 'py-0');
    message.classList.remove('my-3');
    oldData = pendingData;
    events.emit.data(pendingData);
  };

  events.on.seed((newData: Data) => {
    pendingData = newData;
    onClick();
  });

  events.on.data((newData: Data) => {
    // Just emit the data if there is nothing to compare against.
    if (oldData === undefined) {
      oldData = newData;
      events.emit.data(newData);
      return;
    }

    // If we are comparing non-array items, just check for equality.
    if (!Array.isArray(oldData) || !Array.isArray(newData)) {
      if (!equal(oldData, newData)) {
        setPending(newData, 'updatedMessage', 1);
      }
      return;
    }

    // Zip old and new items for easy comparison. Use the new data as the source of truth. The id
    // parameter is used to make them represent the same entity.
    const zipped = newData.map<[Item | undefined, Item]>((newItem) => {
      const oldItem = (oldData as Item[]).find((o) => o[id] === newItem[id]);
      return [oldItem, newItem];
    });

    // Count new items where nothing matches the id of an old one.
    const newCount = zipped.filter(([oldItem]) => !oldItem).length;
    if (newCount) {
      setPending(newData, 'newMessage', newCount);
      return;
    }

    // If there are no new items, check is any items have been updated using deep equality..
    const diffCount = zipped.filter(([oldItem, newItem]) => !equal(oldItem, newItem)).length;
    if (diffCount) {
      setPending(newData, 'updatedMessage', diffCount);
    }
  });

  return (
    <div
      className={`message mx-3 is-${color} ${styles.message}`}
      ref={(node) => {
        message = node;
      }}
    >
      <div
        className={`message-body is-clipped is-flex py-0 ${styles.messageBody} ${styles.hidden}`}
        ref={(node) => {
          messageBody = node;
        }}
      >
        <span
          ref={(node) => {
            messageText = node;
          }}
        />
        <button className={`button is-${color}`} onclick={onClick} type="button">
          {utils.formatMessage('buttonLabel')}
        </button>
      </div>
    </div>
  );
});
