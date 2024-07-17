---
icon: project-diagram
---

# Architecture

This page serves as brief description of the general architecture of Appsemble and how each
component interacts with each other.

## Table of Contents

- [Introduction](#introduction)
- [App](#app)
- [Editor](#editor)
- [Server](#server)
- [CLI](#cli)
- [SDK](#sdk)
- [Blocks](#blocks)

## Introduction

Appsemble is split up in different components that communicate with each other in order to create
and display apps.

These components are:

- App
- Studio
- Server
- Database
- CLI
- SDK
- Block

In the diagram below the structure of Appsemble components is described.

```mermaid
graph BT
  subgraph Docker Container
    A("Server (API)")
    C(App) --> A
    D(Studio) --> A
  end
  B(Database)
  A --> B
  E(CLI) --> A
  F(SDK) --> C
  G(Block) --> F
  style A fill:#eee,stroke:#777,color: #000
  style B fill:#eee,stroke:#777,color: #000
  style C fill:#eee,stroke:#777,color: #000
  style D fill:#eee,stroke:#777,color: #000
  style E fill:#eee,stroke:#777,color: #000
  style F fill:#eee,stroke:#777,color: #000
  style G fill:#eee,stroke:#777,color: #000
```

## App

The app component handles everything that is necessary in order to render apps as well as submitting
new data. Apps are uploaded to the database using the Appsemble editor after which it can be
displayed by retrieving the app definition from the database.

The app definition contains information about how an app should be built, such as pages, blocks,
resource definitions and security. Depending on the configuration, apps may communicate with either
the Appsemble server or external servers to fetch and submit data, defaulting to the Appsemble
server.

## Editor

The editor component allows users to create and manage their apps via an interactive environment.
Apps can be edited by making changes to the app definition defined in `YAML`, which in turn can be
previewed before submitting it to the server. It does this by communicating directly with the app
component. The editor itself does _not_ communicate with anything other than the Appsemble server on
its own, though apps in the preview panel can.

## Server

The server component serves as the central point of connection between every component. It hosts the
app and studio components as well as the API, which is used to interact with the database.

## CLI

The CLI allows developers to communicate with the Appsemble server in order to register new blocks,
upload new versions of existing blocks, or upload themes for entire organizations.

## SDK

The SDK provides the link between blocks and apps, it provides the code within blocks to receive
information and context about the app it’s being displayed in, with information such as available
resources and parameters.

## Blocks

Blocks are what app developers will use to build apps. Pages in apps can be composed using blocks in
order to create apps that do exactly what the user needs. Blocks can be developed in any language
that is compatible with the Appsemble SDK, such as plain JavaScript, React, and Vue. See section
[Developing Blocks](https://appsemble.app/docs/02-development/developing-blocks) on how to create
blocks.

Within apps blocks are contained in their own environments, disallowing them from communicating with
each other in order to prevent conflicts.
