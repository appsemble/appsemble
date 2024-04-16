declare module '@appsemble/sdk' {
  interface OpenAIResponse {
    choices: Choice[];
    created: number;
    id: string;
    model: string;
    object: string;
  }

  interface Choice {
    index: number;
    message: Message;
  }

  interface Message {
    content: string;
    role: string;
  }
  interface EventListeners {
    /**
     * This event can be used to receive incoming data to display.
     */
    response: OpenAIResponse;
  }
  interface Messages {
    /**
     * This message is displayed if the data is empty.
     */
    empty: never;

    /**
     * This message is displayed if there was a problem loading the data.
     */
    error: never;

    /**
     * This message is displayed if no data has been loaded yet.
     */
    loading: never;
  }
}
