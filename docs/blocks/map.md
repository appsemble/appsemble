# Map

## Introduction

A block that displays a map powered by [OpenStreetMap] that can be used to display and interact with
markers.

Markers can be loaded from external sources or from Appsemble's resource API.

## Actions

| Action      | Required | Description                                           |
| ----------- | -------- | ----------------------------------------------------- |
| markerClick | false    | Action that gets dispatched when a marker is clicked. |

## Resources

| Resource   | Required | Description                                            |
| ---------- | -------- | ------------------------------------------------------ |
| marker     | true     | An object used to describe how to retrieve marker data |
| marker.url | true     | The API URL used to fetch marker data                  |

## Parameters

| Parameter | Default   | Description                                          |
| --------- | --------- | ---------------------------------------------------- |
| longitude | longitude | The name of the field used to retrieve the longitude |
| latitude  | latitude  | The name of the field used to retrieve the latitude  |

## Images

<a href="../images/map.png"  target="_blank"><img src="../images/map.png" style="width: 300px" /></a>
