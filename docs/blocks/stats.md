---
menu: Blocks
path: /blocks/stats
---

# Stats

## Introduction

A block that renders some simple statistics in a friendly manner.

This can be used to represent data in a friendly manner with an icon and a label.

## Parameters

| Parameter      | Default | Description                                                                   |
| -------------- | ------- | ----------------------------------------------------------------------------- |
| fields[].value |         | The name of the field to render. Supports [remappers](/guide/remappers).      |
| fields[].icon  |         | A font awesome icon used to represent the data.                               |
| fields[].label |         | The label used to represent the data. Supports [remappers](/guide/remappers). |

## Events

### Listen Events

| Event | Description                                           |
| ----- | ----------------------------------------------------- |
| data  | On what event to listen for incoming data to display. |

## Images

<span class="screenshot"></span>

![Stats screenshot](../images/stats.png)
