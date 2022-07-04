Actions are behaviors that define what happens when certain events within blocks or pages trigger.
Examples of such triggers are the `onLoad` action in the
[data-loader block](/blocks/@appsemble/list) that gets called when the data-loader loads its initial
data, and the `onSubmit` action in the [form block](/blocks/@appsemble/form) that gets triggered
whenever the user presses the submit button.

The behavior of an action can be defined within the `actions` object in a block or page. An action
always requires the property `type`, which is what is used to determine which action should be used
whenever its associated trigger occurs.

The `onSuccess` and `onError` properties can be used to define additional actions that should be
called depending on whether the action that was initially dispatched ran successfully or not. This
can be useful for triggering multiple actions in a row, such as calling the `log` action before
proceeding with a `link` action.

Below is an overview of each action that Appsemble supports. Depending on the type of action,
additional parameters can be defined to alter its behavior. The name of the action is what should be
used as the `type`.
