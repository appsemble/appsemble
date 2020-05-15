---
menu: Blocks
route: /blocks/list
---

# List

## Introduction

A block that can be used to display a vertically oriented list of data.

## Actions

| Action  | Required | Description                                         |
| ------- | -------- | --------------------------------------------------- |
| onClick | false    | Action that is called when clicking on a list item. |

## Parameters

| Parameter      | Default | Description                                                                                                                       |
| -------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| header         |         | The name of the field to read from the data. Supports remappers.                                                                  |
| base           |         | The name of the property to use as the source of data withn an object, if not defined the object itself is used as a data source. |
| icon           |         | The icon to display next to the header.                                                                                           |
| fields         |         | A list of fields to display                                                                                                       |
| fields[].value |         | The value to display. Supports remappers.                                                                                         |
| fields[].label |         | The label that is presented to the user                                                                                           |
| fields[].icon  |         | The FontAwesome icon to display                                                                                                   |

Properties in `header` and each field can be omitted, allowing for different looks depending on
which parameters are filled in.

## Events

### Listen Events

| Event | Description                                                                                                                   |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- |
| data  | The event that is triggered when data is received. Compatible data that is received will be displayed. Must be a set of data. |

## Images

<span class="screenshot"></span>

![Table screenshot](../images/list.png)
