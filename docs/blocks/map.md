---
menu: Blocks
route: /blocks/map
---

# Map

## Introduction

A block that displays a map powered by [OpenStreetMap](https://www.openstreetmap.org/about) that can
be used to display and interact with markers.

Markers can be loaded from external sources or from Appsemble’s resource API.

## Actions

| Action        | Required | Description                                           |
| ------------- | -------- | ----------------------------------------------------- |
| onMarkerClick | false    | Action that gets dispatched when a marker is clicked. |

## Parameters

| Parameter | Default   | Description                                          |
| --------- | --------- | ---------------------------------------------------- |
| longitude | longitude | The name of the field used to retrieve the longitude |
| latitude  | latitude  | The name of the field used to retrieve the latitude  |

## Events

### Emit Events

| Event | Description                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| move  | Event that gets emitted when moving the map around. Will apply [OData filters](https://www.odata.org/) to limit the range of items fetched. |

### Listen Events

| Event | Description                                                                                                                   |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- |
| data  | The event that is triggered when data is received. Compatible data that is received will be displayed. Must be a set of data. |

## Images

<span class="screenshot"></span>

![Map screenshot](../images/map.png)
