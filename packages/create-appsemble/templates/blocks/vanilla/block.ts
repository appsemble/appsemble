// Blocks can actions, parameters, messages, and event listeners and emitters. These can be defined
// by augmenting the @appsemble/sdk module. Typically this happens in a file named block.ts. When a
// block is published, the CLI will process the augmented interfaces and validate the app definition
// complies with them. The JSDoc will be used to render documentation.

declare module '@appsemble/sdk' {
  interface Actions {
    /**
     * What happens if the button is clicked.
     */
    onClick: never;
  }

  interface Messages {
    /**
     * The button label.
     */
    label: never;
  }
}
