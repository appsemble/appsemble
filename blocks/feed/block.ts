import type { MapperFunction } from '@appsemble/utils';

interface Reply {
  /**
   * The field that is used to associate the ID of the resource this reply belongs to.
   */
  parentId?: string;

  /**
   * The field that is used to fetch the name of the author.
   */
  author?: string;

  /**
   * The field that is used to read the content of the reply.
   */
  content?: string;
}

export interface Remappers {
  title: MapperFunction;
  subtitle: MapperFunction;
  heading: MapperFunction;
  picture: MapperFunction;
  pictures: MapperFunction;
  description: MapperFunction;
  author: MapperFunction;
  content: MapperFunction;
  latitude: MapperFunction;
  longitude: MapperFunction;
}

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * The text that displays inside the button.
     */
    buttonLabel?: string;

    /**
     * The definition used to display replies.
     */
    reply?: Reply;

    /**
     * The base URL used to display pictures.
     *
     * If not defined, the Asset API will be used instead.
     */
    pictureBase?: string;

    /**
     * The title displayed on the card.
     */
    title?: string;

    /**
     * The subtitle displayed on the card.
     */
    subtitle?: string;

    /**
     * The heading displayed on the card.
     */
    heading?: string;

    /**
     * The highlighted picture.
     */
    picture?: string;

    /**
     * A list of pictures that are displayed below the highlighted picture.
     */
    pictures?: string[];

    /**
     * The description or content of the card.
     */
    description?: string;

    /**
     * The latitude of the card.
     *
     * If `latidude` and `longitude` are defined, a map will be rendered.
     */
    latitude?: string;

    /**
     * The longitude of the card.
     *
     * If `latidude` and `longitude` are defined, a map will be rendered.
     */
    longitude?: string;
  }

  interface Actions {
    /**
     * Action that gets dispatched when a user clicks on an avatar.
     */
    onAvatarClick: never;

    /**
     * Action that gets dispatched when the button is clicked.
     *
     * The button won't display if this is not defined.
     */
    onButtonClick: never;

    /**
     * Action that gets dispatched when submitting a reply.
     */
    onSubmitReply: never;

    /**
     * Action to retrieve replies, dispatched on every feed item.
     */
    onLoadReply: never;
  }

  interface EventListeners {
    /**
     * The event that is triggered when data is received.
     *
     * Compatible data that is received will be displayed.
     */
    data: never;
  }
}
