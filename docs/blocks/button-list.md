---
menu: Blocks
route: /blocks/button-list
---

# Button List

## Introduction

A list of buttons that can each have their own custom click handler.

It can be used on any page that requires multiple interactive buttons next to each other. Most of
the modifiers supported by [Bulma’s buttons](https://bulma.io/documentation/elements/button) are
supported and can be combined.

## Actions

| Action    | Required | Description                                                                                                                        |
| --------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| onClick   | false    | Action that gets dispatched when a button is clicked that doesn’t specify its own click action.                                    |
| [any key] | false    | A custom action that gets dispatched when a button is clicked that has the same click action specified as the name of this action. |

## Parameters

| Parameter           | Default  | Description                                                                                                                                |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| buttons[]           |          | The list of buttons.                                                                                                                       |
| buttons[].onClick   | onClick  | The name of the action to trigger when the button is clicked.                                                                              |
| buttons[].label     |          | The label to render on the button.                                                                                                         |
| buttons[].icon      |          | A [Font Awesome](https://fontawesome.com/icons) icon name to render on the button                                                          |
| buttons[].size      | `normal` | The default size of the button. Supported sizes are: `small`, `normal`, `medium`, `large`                                                  |
| buttons[].color     |          | The Bulma colors applied to the button. Supported options are: `primary`, `link`, `info`, `success`, `warning`, `danger`, `dark`, `white`. |
| buttons.light       | false    | Whether or not the light Bulma colors should be used.                                                                                      |
| buttons[].rounded   | false    | Whether the button should be rounded.                                                                                                      |
| buttons[].fullwidth | false    | Whether the button should be full width.                                                                                                   |
| buttons[].inverted  | false    | Whether the inverted color scheme should be used.                                                                                          |
| buttons[].outlined  | false    | Whether the color scheme should be applied to the button itself, or the outlines.                                                          |

## Events

### Listen Events

| Event | Description                                                                                                                                   |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| data  | The event that is triggered when data is received. This data can be used with remap to display labels dynamically based on the received data. |

## Images

<span class="screenshot"></span>

![Action button screenshot](../images/button-list.png)
