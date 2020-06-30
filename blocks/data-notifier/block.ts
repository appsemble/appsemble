import type { BulmaColor } from '@appsemble/sdk';

export {};

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * The property used to identify resources when comparing them in case of array data.
     *
     * @default 'id'
     */
    id?: string;

    /**
     * The Bulma color to use for the message.
     *
     * @default 'dark'
     */
    color?: BulmaColor;

    /**
     * The label to display on the refresh button of the notification.
     *
     * @default 'Refresh'
     */
    buttonLabel?: Remapper;

    /**
     * The message to display when new data is available.
     *
     * This will be called with the `count` parameter, which refers to the amount of new items.
     *
     * @default 'New data is available'
     */
    newMessage?: Remapper;

    /**
     * The message to display when existing data has been changed.
     *
     * This will be called with the `count` parameter, which refers to the amount of changed items.
     *
     * @default 'Data has been changed'
     */
    updatedMessage?: Remapper;
  }

  interface EventEmitters {
    /**
     * Event that gets emitted when new data is available.
     */
    data: {};
  }

  interface EventListeners {
    /**
     * The event to listen on for new data.
     */
    data: {};
  }
}
