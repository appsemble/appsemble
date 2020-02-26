---
menu: Blocks
path: /blocks/data-loader
---

# Data Loader

## Introduction

A block that fetches data and emits it using the events API.

This can be used to provide data to other blocks.

## Actions

| Action | Required | Description                                                                                                |
| ------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| onLoad | true     | Action that gets dispatched when a new filter gets applied. This also gets called during the initial load. |

## Parameters

| Parameter       | Default | Description                                                                                            |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| skipInitialLoad | false   | By default the `onLoad` action is triggered immediately. By setting this to `true`, this won’t happen. |

## Events

## Emit Events

| Event | Description                                                                                                            |
| ----- | ---------------------------------------------------------------------------------------------------------------------- |
| data  | Event that gets emitted once the `onLoad` action has finished. It can be triggered again by sending a `refresh` event. |

### Listen Events

| Event   | Description                                                                                                                                        |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| refresh | When received, the `onLoad` action will be triggered using the parameters passed through this event, which in turn triggers the `data` emit event. |
