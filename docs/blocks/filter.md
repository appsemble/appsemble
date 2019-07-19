---
menu: Blocks
path: /blocks/filter
---

# Filter

## Introduction

A block that can filter data and pass it to other blocks using the event API.

## Actions

| Action | Required | Description                                                                                                |
| ------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| onLoad | true     | Action that gets dispatched when a new filter gets applied. This also gets called during the initial load. |

## Parameters

| Parameter             | Default                                      | Description                                                                                                                       |
| --------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| event                 |                                              | Required field that determines the name of the event that other blocks can listen to to retrieve filtered data.                   |
| highlight             |                                              | The field to highlight outside of the filter dialog. If set, changing the highlighted value will immediately apply a new filter   |
| fields                |                                              | A list of objects describing each field that can be filtered                                                                      |
| fields[].name         |                                              | The name used when storing this field                                                                                             |
| fields[].label        | field[].name                                 | User-facing label describing the field                                                                                            |
| fields[].type         | string                                       | The type of the data                                                                                                              |
| fields[].range        | false                                        | Whether a range picker should be used                                                                                             |
| fields[].defaultValue |                                              | The default value used for the field. If not set, an empty filter option is added to allow for not filtering on this field at all |
| fields[].icon         |                                              | Name of the [Font Awesome icon](https://fontawesome.com/icons?d=gallery&m=free) to be displayed next to the label.                |
| fields[].emptyLabel   |                                              | The text to show for empty enum items.                                                                                            |
| fields[].enum         |                                              | A list of predetermined options the user can pick from.                                                                           |
| fields[].enum[].label | User-facing label describing the option      |
| fields[].enum[].value | The value that gets submitted when filtering |
