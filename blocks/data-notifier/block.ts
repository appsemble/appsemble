import { type BulmaColor } from '@appsemble/sdk';

declare module '@appsemble/sdk' {
  interface Messages {
    /**
     * The label to display on the refresh button of the notification.
     *
     * @default 'Refresh'
     */
    buttonLabel: never;

    /**
     * The message to display when new data is available.
     *
     * This will be called with the `count` parameter, which refers to the amount of new items.
     */
    newMessage: { count: number };

    /**
     * The message to display when existing data has been changed.
     *
     * This will be called with the `count` parameter, which refers to the amount of changed items.
     */
    updatedMessage: { count: number };
  }

  interface Parameters {
    /**
     * The property used to identify resources when comparing them in case of array data.
     *
     * @default 'id'
     */
    id?: string;

    /**
     * The Bulma color to use for the message and the refresh button.
     *
     * @default 'dark'
     */
    color?: BulmaColor;
  }

  interface EventEmitters {
    /**
     * Event that gets emitted when new data is available.
     */
    data: never;
  }

  interface EventListeners {
    /**
     * The event to listen on for new data.
     */
    data: never;

    /**
     * Set and emit the initial data.
     *
     * This is useful for example in combination with the `filter` block.
     */
    seed: never;
  }
}
