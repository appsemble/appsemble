# Groups

## Table of Contents

- [Introduction](#introduction)
- [Roles](#roles)
  - [Resources](#resources)
  - [Pages](#pages)
- [Actions](#actions)

## Introduction

Groups can be used to organize groups of members in an app. Typically groups represent users that
are linked together somehow. For example they belong to the same organizational unit or they are
classmates. App managers can view and manage groups from the _Groups_ page in the app page in
Appsemble Studio. In order to become a group member, a user must first be registered as an app
member. A user can do so by logging into the app. Groups determine how its members can share
resources with each other.

To enable groups, first `security.groups` needs to be enabled in the app definition. For more
information, see [groups security](security.md#groups)

## Roles

Within a group a user has one of the roles _Manager_ or _Member_. The exact difference between these
roles is determined by the security roles in the app definition. From a security perspective it’s
most important to configure resource roles correctly. For a good user experience, it’s best to make
sure the app pages match the resource security definitions.

### Resources

If a resource `create` definition specifies a role of `$group:manager`, only a user who is a manager
of a group may create such a resource. If the role is `$group:member`, only a user who is a group
member may create such a resource. The latter includes the group manager.

If a resource action definition other than `create` specifies a role of `$group:member`, then any
group member of the resource author may perform the action on that resource. If the role is
`$group:manager`, then only the managers of the group the author is in may perform that action on
the resource.

For example, let’s say we have an app for managing a soccer club:

```yaml validate resources-snippet
resources:
  strategy:
    schema:
      type: object
      additionalProperties: false
      properties:
        description:
          type: string
          multiline: true
    create:
      roles:
        - $group:manager
    query:
      roles:
        - $group:member
    get:
      roles:
        - $group:member

  absence:
    schema:
      type: object
      additionalProperties: false
      properties:
        date:
          type: string
          format: date
    create:
      roles:
        - $group:member
    query:
      roles:
        - $group:manager
    get:
      roles:
        - $group:manager
```

We have the following groups:

**Red group**:

- Manny (manager)
- James
- Alex

**Blue group**:

- Mandy (manager)
- Jessie
- Alex

Each soccer group has their own strategy. Only the group manager may create a strategy. Manny may
create a strategy (`$group:manager`), meaning they are now the author of that strategy. Because
James and Alex are in the same group as Manny, they may view the strategy (`$group:member`).

Mandy is the manager of the blue group. This means they can also create a strategy
(`$group:manager`), which can then be viewed by Jessie and Alex (`$group:member`). Because Alex is
in both the red and the blue group, Alex can see both strategies.

Sometimes players (represented by group members) can’t be present at a game. In this case they need
to report themselves absent. Players can only report their own absence (`$group:member`) using a
create action. Let’s say Jamie calls in sick. Now only Manny can see this (`$group:manager`).
However, if Alex reports absence, both Manny and Mandy can see it.

### Pages

Page security rules should match that of the data they display. Otherwise, they show the user a
bunch of errors which leads to a bad user experience.

Continuing with the Soccer club app in the resources example, the following could represent the
app’s pages:

```yaml validate pages-snippet
pages:
  - name: Create strategy
    roles:
      - $group:manager
    blocks:
      - type: form
        version: 0.29.11
        actions:
          onSubmit:
            type: resource.create
            resource: strategy
            onSuccess:
              type: link
              to: Strategies
        parameters:
          fields:
            - label: { translate: name }
              name: name
              type: string
            - label: { translate: description }
              multiline: true
              name: description
              type: string

  - name: Strategies
    roles:
      - $group:member
    blocks:
      - type: action-button
        version: 0.29.11
        parameters:
          icon: plus
        roles:
          - $group:member
        actions:
          onClick:
            type: link
            to: Create strategy

  - name: Report absence
    roles:
      - $group:member
    blocks:
      - type: form
        version: 0.29.11
        actions:
          onSubmit:
            type: resource.create
            resource: absence
            onSuccess:
              type: link
              to: View absence
        parameters:
          fields:
            - label: { translate: player }
              name: player
              type: string
            - label: { translate: description }
              multiline: true
              name: description
              type: string

  - name: View absence
    roles:
      - $group:manager
    blocks:
      - type: action-button
        version: 0.29.11
        parameters:
          icon: plus
        roles:
          - $group:member
        actions:
          onClick:
            type: link
            to: Report absence

  - name: About
    blocks:
      - type: html
        version: 0.29.11
        parameters:
          placeholders:
            summary: This is the groups app
          content: |
            <span data-content="summary" />
```

According to this app definition, only the group manager may view the pages called `Create strategy`
and `View absence`. Any group member may view the `Strategies` and `Report absence` pages, but on
the `Strategies` page, only group managers see a button which links to `Create strategy`. This means
anyone who isn’t part of a group can’t see any of those pages. The `About` page is accessible to
anyone.

## Actions

The following group related actions are can be used within an app:

- [`group.invite`](../actions/03-groups.mdx#groupinvite)
- [`group.join`](../actions/03-groups.mdx#groupjoin)
- [`group.list`](../actions/03-groups.mdx#grouplist)
- [`group.members`](../actions/03-groups.mdx#groupmembers)
