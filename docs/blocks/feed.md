---
menu: Blocks
path: /blocks/feed
---

# Feed

## Introduction

A block that displays a feed of cards.

This can be used for example to show a social media feed in an app.

## Actions

| Action        | Required | Description                                                                                              |
| ------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| onButtonClick |          | Action that gets dispatched when the button is clicked. The button won't display if this is not defined. |
| onLoad        |          | Action that gets dispatched when data is initially loaded.                                               |
| onLoadReply   | true     | Action to retrieve replies, dispatched on every feed item.                                               |
| onSubmitReply |          | Action that gets dispatched when submitting a reply.                                                     |
| onAvatarClck  |          | Action that gets dispatched when a user clicks on an avatar.                                             |

## Parameters

| Parameter      | Default  | Description                                                                                                   |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| buttonLabel    | Click    | The text that displays inside the button.                                                                     |
| title          |          | The field that will be used as the title of a card.                                                           |
| subtitle       |          | The field that will be used as the sub title of a card.                                                       |
| heading        |          | The field that will be used as a heading of a card.                                                           |
| picture        |          | The field that will be used to display a picture. Must refer to a single picture.                             |
| pictures       |          | The field that will be used to display multiple pictures. Only displays when there are at least two pictures. |
| description    |          | The field that will be used as the content description of the card.                                           |
| reply.content  | content  | The field that will be used to read the content of a reply.                                                   |
| reply.author   | author   | The field that will be used to display the author of a reply                                                  |
| reply.parentId | parentId | The field that will be used to associate with the parent resource when submitting a new reply.                |
