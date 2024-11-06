# User Types

## Table of Contents

- [Introduction](#introduction)
- [Platform](#platform)
  - [Platform Guests](#platform-guests)
  - [Platform Users](#platform-users)
  - [Organization Members](#organization-members)
- [Apps](#apps)
  - [App Guests](#app-guests)
  - [App Members](#app-members)
  - [Group Members](#group-members)

## Introduction

In Appsemble there are many types of end users depending on which part of Appsemble they are
interacting with and whether they have an account for it.

## Platform

### Platform Guests

A platform guest is an end user who interacts with the platform via the
[Appsemble Studio](../studio/index.md), but doesn't have an Appsemble account yet. They can see all
existing organizations in the platform, along with their blocks, Appsemble core blocks and public
apps (see [app privacy](../app/security.md#app-privacy)). They can also read the Appsemble
documentation.

### Platform Users

A platform user is a user who interacts with the platform via the
[Appsemble Studio](../studio/index.md) and has an Appsemble account. If the platform user has
registered OAuth2 client credentials in the platform, they can also use the Appsemble CLI.

### Organization Members

To be able to perform any actions on the platform that require authorization, platform users must be
a part of an Appsemble organization. For more information, check out
[the organizations docs](../studio/organizations.mdx)

## Apps

Apps have different mechanisms to determine the permissions of their end users.

### App Guests

An app guest is any end user that visits an Appsemble app without an account for that app. They can
have different permissions within the app based on the `guest` property in the app’s
[security definition](../app/security.md#security-definition).

### App Members

An app member is any end user that has an account in an app. Such an account can be obtained in
different ways (Appsemble OAuth2, [OAuth2](../guides/oauth2.md), [SCIM](../guides/scim.md),
[SAML](../guides/saml.md), etc.) depending on the app’s settings and security definition.

Each app member has a role within the app, that is one of
[the defined roles in the app definition](../app/security.md#roles) or a
[predefined app role](../app/security.md#predefined-app-roles). Having a role gives the app member
the permissions defined in that role.

### Group Members

Group members are app members that are also a part of group in an app, see
[groups](../app/groups.md). Each group member has a different role in each of the groups they are
part of. The possible roles within a group are the same as the possible roles within the app -
[from the app definition](../app/security.md#roles) or
[predefined](../app/security.md#predefined-app-roles).

When interacting with an app, app members can select which group they are currently operating from.
This assumes their role within the group for everything they do in the app until they switch the
selected group or select no group. If no group is selected, the role of the app member within the
app is used instead.

Grouping app members into groups is useful for
[scoping access to resources and assets](../app/groups.md#resources-and-assets) within the app.
