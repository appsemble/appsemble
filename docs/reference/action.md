---
menu: Reference
name: Action
route: /reference/action
---

# Action

Actions are behaviors that define what happens when certain events within blocks or pages trigger.
Examples of such triggers are the `onLoad` action in the [data-loader block](../blocks/list) that
gets called when the data-loader loads its initial data, and the `onSubmit` action in the
[form block](../blocks/form) that gets triggered whenever the user presses the submit button.

The behavior of an action can be defined within the `actions` object in a block or page. An action
always requires the property `type`, which is what is used to determine which action should be used
whenever its associated trigger occurs.

Below is an overview of each action that Appsemble supports. Depending on the type of action,
additional parameters can be defined to alter its behavior. The name of the action is what should be
used as the `type`.

## `link`

The link action can be used to redirect the user to other pages or absolute URLs.

| Parameter | Required | Description                                                                                                                                                                         |
| --------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| to        | true     | The name of the page to link to. Subpages can be referred to using arrays. If this matches with an absolute URL, link will open this instead of matching it with a page or subpage. |

### Example

```yaml
type: link
to: Example Page
```

```yaml
type: link
to:
  - Example Page
  - Sub Page

# Alternatively
to: [Example Page, Sub Page]
```

```yaml
type: link
to: https://example.com
```

## `log`

Outputs the result of the action into the console. This is mostly useful for debugging blocks during
development.

## `noop`

Do nothing when this action is triggered. This is the default action for block actions that are not
required.

## `flow.next`

On [flow pages](page#subpages), proceed to the next page if it is present. Otherwise, the flow is
considered to be complete and [`flow.finish`](#flowfinish) will be called instead.

## `flow.back`

On [flow pages](page#subpages), return to the previous page if it is present. If this is called on
the first page, nothing happens.

## `flow.finish`

On [flow pages](page#subpages), triggers the [`onFlowFinish`](page#onflowfinish) action on the page.

## `flow.cancel`

On [flow pages](page#subpages), triggers the [`onFlowCancel`](page#onflowfinish) action on the page.

## `resource`

The resource actions simplify the usage of [request](#request) by providing it with defaults based
on the resource definition. Resource actions are described in more detail
[here](../guide/resources#resource-actions). All parameters that apply to request actions can also
be used with resource actions.

| Parameter | Required | Description                      |
| --------- | -------- | -------------------------------- |
| resource  | true     | The name of the resource to use. |

## `request`

Performs a web request. This can be used to call the Appsemble API or an external API in order to
fetch data or send data. When sending `POST`, `PUT`, `DELETE` and `PATCH` calls the data that is
currently available in the block gets passed through. An example of its usage is to send a `POST`
request using the [form block](../blocks/form).

If the content type of the request is `text/xml` or `application/xml`, the data will be converted to
JSON.

| Parameter  | Required | Description                                                                                                                                                                                                                                       |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| url        | true     | The URL to send the request to. Can be a relative URL (Eg. `/api/health`) for usage with the Appsemble API or an absolute URL (Eg. `https://example.com`) for usage with external sites.                                                          |
| method     |          | The type of request to make. Defaults to `GET` if omitted.                                                                                                                                                                                        |
| query      |          | An object representing the values that get added to the query string. Templating can be applied here to make Appsemble inject values based on the data it received.                                                                               |
| proxy      |          | By default requests will be proxied through the Appsemble API. This allows to protect user data and ensures [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) is enabled. This behaviour can be disabled by setting this to `false`. |
| schema     |          | The name of the schema to validate against before submitting data.                                                                                                                                                                                |
| base       |          | The base element to return when used in `GET` queries. This can be used to flatten the data being returned from the API. Dot notation can be used.                                                                                                |
| serialize  |          | The method used to serialize the request data. Setting this to `formdata` will send the request as a `multipart/form-data` request. By default the data is serialized as an `application/json` request.                                           |
| blobs      |          | An object containing a range of parameters used to upload files to the server.                                                                                                                                                                    |
| blobs.type |          | The method used to upload files to the server. Supports `upload` to override the default behavior.                                                                                                                                                |

### Query templates

The `query` action parameter can be used to customize what data gets added to the query string of
the request. This can either be a string that is taken as-is, or they can be constructed using query
templates.

Query templates works by wrapping parts of the value of the object with `{}`. This will let
Appsemble know that it should replace that part of the string with a value taken from the available
data that was passed to the action.

For example, the following `query` object will result in this URL:
`https://example.com/api/foo?$filter=id eq 1 and foo eq 'bar'&baz=23`

```yaml
type: request
url: https://example.com/api/foo
query:
  $filter: id eq {id} and foo eq bar
  baz: 23
```

## `dialog`

This action opens a pop-up dialog that can be used to seamlessly transition to a new set of blocks
temporarily.

Dialogs can be closed by calling the [`dialog.ok`] and [`dialog.error`]. Users can still manually
close dialogs, which should be supported by the app.

| Parameter  | Required | Description                                                                                                      |
| ---------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| blocks     | true     | The list of blocks to render.                                                                                    |
| closable   |          | Whether users are allowed to close the dialog by clicking outside of it or on the close button. Defaults to true |
| fullscreen |          | Whether the dialog should be displayed fullscreen as if it's a new page, or as a pop-up.                         |

## `dialog.ok`

Close the dialog that is described above, signaling the `dialog` action succeeded.

## `dialog.error`

Close the dialog that is described above, signaling the `dialog` action has failed.

## `event`

This action allows for other blocks to emit data upon triggering the action. This can be used to
make blocks interact with each other, such as triggering the `data-loader` block to refresh itself
by sending an event action that matches the name of what the block is listening to.

| Parameter | Required | Description                    |
| --------- | -------- | ------------------------------ |
| event     | true     | The name of the event to emit. |

## `static`

The `static` action returns static data defined in the action definition. This is useful for example
for stubbing data.

| Parameter | Required | Description                |
| --------- | -------- | -------------------------- |
| value     | true     | The static value to return |
