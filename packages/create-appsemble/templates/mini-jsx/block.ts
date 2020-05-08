export {};

declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * The title of the explanation
     */
    title: string;

    /**
     * The text that gets displayed behind the title
     */
    backdrop: string;

    /**
     * The icon displayed in the center.
     *
     * Based on Font Awesome icons
     */
    icon: string;

    /**
     * The description of the explanation
     */
    description: string;

    /**
     * The text of the submit button
     */
    submitText: string;
  }

  interface Actions {
    /**
     * This action is dispatched when the submit button is pressed.
     */
    onSubmit: {};

    /**
     * This action is dispatched hwen the icon in the center is pressed.
     */
    onIconClick: {};
  }
}
