# Developing Blocks

This document will guide you through the creation of your first block.

## Initialize the Project

To start developing blocks, first the Appsemble repository needs to be cloned and installed as
described in the
[Getting Started](https://gitlab.com/appsemble/appsemble/blob/main/README.md#getting-started)
instructions in the readme.

Next, publish the existing blocks following the instructions from the
[Blocks](https://gitlab.com/appsemble/appsemble/blob/main/README.md#publishing-blocks) section.

## Create Your First Block

A new block can be bootstrapped by running the following command.

```sh copy
yarn create-appsemble block
```

This will prompt some questions about the new block. In the final prompt, you will be prompted to
select a template. These templates can be used as a starting point when developing blocks.

The following templates are available by default:

- **Preact**: A simple Preact set-up that contains a component that can load data and display it in
  a table.
- **Mini JSX**: A basic set-up using [`mini-jsx`](https://www.npmjs.com/package/mini-jsx), this can
  be used for blocks with simple logic while still leveraging the JSX syntax you might be used to
  from Preact or React.
- **Vanilla**: The most basic template available, using pure HTML and JavaScript to bootstrap the
  block. This template can also be used as a starting point for use with other third party libraries
  or frameworks.

> **Note**: It is possible to use other frameworks. We’ve opted to provide templates for the most
> lightweight frameworks. Since apps can contain many blocks, we suggest trying to keep the blocks
> as lightweight as possible. Some frameworks may produce strange behavior due to the way blocks are
> attached to the Shadow DOM.

For now, lets bootstrap a vanilla JavaScript block using the block name `test` and organization name
`org`. The output should look like this:

```
? For which organization is the block? org
? What should be the name of the block? test
? What kind of block project should be bootstrapped?
   mini-jsx
   preact
 > vanilla
```

The block will be created in the _blocks/_ directory. Its version will be `0.0.0`.

Make sure the local Appsemble server is running, then run the following to publish the newly created
block.

```sh copy
yarn appsemble block publish blocks/test
```

> **Note**: In order to publish a block for an organization, make sure you are in the same
> organization as what is stated in the first half of the block name. For example: In order to
> publish `@appsemble/foo` you need to be a member of the `appsemble` organization with sufficient
> permissions to publish blocks for the organization.

## Testing the Block

Open the Appsemble studio on at the base URL of Appsemble. Login, and create your first app. This
following example app will display your new block.

```yaml copy filename="app-definition.yaml"
name: Test App
defaultPage: Home

pages:
  - name: Home
    blocks:
      - type: '@org/test'
        version: 0.0.0
        actions:
          onClick:
            type: link
            to: Other Page
  - name: Other Page
    blocks:
      - type: '@org/test'
        version: 0.0.0
        actions:
          onClick:
            type: link
            to: Home
```

Enter this app definition, save it, and it should display the new block in the app preview. The app
contains two pages that link to each other by clicking the button created by the new test block. ✨

> **Note**: You may have noticed the block already has the `button` class and a specific style. This
> is because Appsemble automatically injects the [Bulma][] CSS framework and [Font Awesome][] into
> each block. It is possible, recommended even, to use Bulma classes to add minimal styling to your
> block. This allows app builders and organizations to add custom styling when they use your block.

## Modifying the Block

> **Note**: Any block that can be found within the list of workspaces listed in `package.json` will
> be hot-reloaded after having published it. This means that when developing blocks, it is not
> necessary to keep publishing new versions of blocks to test changes. By default, the `blocks`
> directory is checked for this, but other directories such as `../amsterdam/blocks`, assuming this
> directory exists and has blocks, will be hot-reloaded as well.

Now lets make the text of the button configurable using the app definition.

```js copy
button.type = 'button';
button.textContent = parameters.text || 'Click me!';
button.classList.add('button');
```

In the app definition, specify the value of the parameter.

```yaml copy filename="app-definition.yaml"
name: Test App
defaultPage: Home

pages:
  - name: Home
    blocks:
      - type: '@org/test'
        version: 0.0.0
        parameters:
          text: Go to the other page.
        actions:
          onClick:
            type: link
            to: Other Page
  - name: Other Page
    blocks:
      - type: '@org/test'
        version: 0.0.0
        parameters:
          text: Go to the home page.
        actions:
          onClick:
            type: link
            to: Home
```

It may be interesting to show content from the context that the page was linked to. Blocks can pass
data to dispatched actions. This data is then available ad the `data` object in the next block.

Let’s to a little rewrite of our block.

```js copy
import { bootstrap } from '@appsemble/sdk';

bootstrap(({ actions, data, events, pageParameters, parameters, shadowRoot, utils }) => {
  const wrapper = document.createElement('div');
  const text = document.createElement('p');
  const button = document.createElement('button');
  text.textContent = data ? `I was linked from ${data.text}` : 'I was loaded without data';
  button.type = 'button';
  button.textContent = 'Click me!';
  button.textContent = parameters.text;
  button.classList.add('button');
  button.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      actions.onClick.dispatch(parameters);
    },
    true,
  );

  wrapper.append(text);
  wrapper.append(button);
  return wrapper;
});
```

As you can see, the button is now wrapped by a wrapper element. There is also a new text element. If
the block received data, the text will render the text property of the received data.

When the click action if dispatched, the block parameters are passed as the context to the action.
In our example app, the test block on the other page will render this when the user navigates
between pages.

Appsemble also injects some utility functions. For example, it is possible to show a message. Let’s
add a delay and a message when the user is navigating to the other page.

```ts copy
button.addEventListener(
  'click',
  (event) => {
    event.preventDefault();
    utils.showMessage('Handling click actions in 5 seconds…');
    setTimeout(() => actions.onClick.dispatch(parameters), 5000);
  },
  true,
);
```

Blocks may communicate with each other by emitting and listening on events. Let’s modify the event
so the click event will emit a `button-click` event instead.

To do this we need to define which kinds of events can be emitted from the block. This is used to
map the names of events correctly to the name of the event in the code based on what’s used in the
app definition.

in `block.ts`:

```ts copy
declare module '@appsemble/sdk' {
  interface EventEmitters {
    click: {};
  }

  interface EventListeners {
    data: {};
  }
}
```

We’ll also add a listener using `events.on.data()`. This will log the block’s own parameters and the
data received from the event.

```js copy filename="index.ts"
import { bootstrap } from '@appsemble/sdk';

bootstrap(({ actions, data, events, pageParameters, parameters, shadowRoot, utils }) => {
  const wrapper = document.createElement('div');
  const text = document.createElement('p');
  const button = document.createElement('button');
  text.textContent = data ? `I was linked from ${data.text}` : 'I was loaded without data';
  button.type = 'button';
  button.textContent = 'Click me!';
  button.textContent = block.parameters.text;
  button.classList.add('button');
  events.on.data((d) => {
    console.log('My parameters:', parameters);
    console.log('Event data:', d);
  });
  button.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      events.emit.click(parameters);
    },
    true,
  );
  wrapper.append(text);
  wrapper.append(button);
  return wrapper;
});
```

The event will be emitted to all blocks on the page. Go on and add a second `@org/test` block the
page to see the event is received by both blocks.

## Further Reading

To get a better idea of how blocks work, or for inspiration of what blocks can be created, please
have a look at the
[officially supported Appsemble blocks](https://gitlab.com/appsemble/appsemble/-/tree/0.20.29/blocks).
For example, if you want to create a block to display a set of dynamically loaded data, have a look
at the `table` or `tiles` block. If you’re interested in displaying a single entity, have a look at
the `detail-viewer` or `stats` block. If would like to create a block to process data based on
events, have a look at the `data-loader` or `data-notifier` block.

Need help developing a block? Feel free to join our [Discord server](https://discord.gg/q5aZAyq5kZ).

[bulma]: https://bulma.io
[font awesome]: https://fontawesome.com
