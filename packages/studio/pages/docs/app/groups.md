# Groups

## Table of Contents

- [Introduction](#introduction)
- [Roles](#roles)
  - [Resources](#resources-and-assets)
  - [Pages](#pages)
- [Actions](#actions)

## Introduction

Groups can be used to organize app members in arbitrary collections. Typically, groups represent app
members that are linked together somehow. For example, they belong to the same organizational unit,
or they are classmates. Organization members or app members with sufficient permissions can create
and manage groups. They can invite new app members to groups as well. Groups determine how their
members can share resources with each other.

## Roles

Within a group, group members have a certain role, similar to how app members have a role in an app,
see [security roles](security.md#roles). Having a role gives the group member certain permissions
scoped to the group. From the app’s UI, app members can select from which group they are currently
operating. If a group is selected, the role of the app member within the group is inferred and the
permissions for that role are used for all app operations. If no group is selected, the app member’s
app role is used instead. The id of the currently selected group is passed to all app actions that
require certain permissions. Check out [actions](../actions/index.mdx) for more information.

### Resources and Assets

To scope a resource for a specific group, the id of the currently selected group is automatically
passed to the query of the `resource.create` action. The same goes for other resource actions. When
a resource is scoped within a group, only members of that group with enough permissions, inferred
from their role in the group, can perform operations on the resource.

For example, let’s say we have an app for managing a soccer club.

We need the following security definition in our app to make use of groups properly:

```yaml validate security-snippet
security:
  default:
    role: User
  roles:
    User:
      permissions: []
    GroupMember:
      permissions: []
    Manager:
      inherits:
        - GroupMember
        - GroupMembersManager
      permissions:
        - '$resource:strategy:create'
        - '$resource:absence:query'
        - '$resource:absence:get'
    Player:
      inherits:
        - GroupMember
      permissions:
        - '$resource:absence:create'
        - '$resource:strategy:query'
        - '$resource:strategy:get'
```

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

  absence:
    schema:
      type: object
      additionalProperties: false
      properties:
        date:
          type: string
          format: date
```

We have the following groups:

**Red Team**:

- Manny (Manager)
- James (Player)
- Alex (Player)

**Blue Team**:

- Mandy (Manager)
- Jessie (Player)
- Alex (Player)
- Manny (Player)

Each soccer team has their own group and strategies. Only members of a group with the role `Manager`
within the group can create strategies. Manny may create a strategy scoped to the `Red Team`.
Because James and Alex are in the same group as Manny and they have the `Player` role within that
group, they may view the strategy.

Mandy has the role `Manager` in the `Blue Team` group. This means they can also create a strategy,
which can then be viewed by Jessie, Alex and Manny, which are in the same group with role `Player`.
Because Alex is in both the `Red Team` and `Blue Team` groups, Alex can see both strategies.

Notice that Manny is a member of the `Red Team` group with role `Manager` but he is also a member of
the `Blue Team` group with the role `Player`. This means that they can create strategies scoped to
the `Red Team` group, but they can only see strategies scoped to the `Blue Team` group.

Sometimes players (represented by group members) can’t be present at a game. In this case they need
to report themselves absent. Players can only report their own absence using the `resource.create`
action. Let’s say James calls in sick. Now only Manny can see this.

### Pages

Page security rules should match that of the data they display. Otherwise, they show the user a
bunch of errors which leads to a bad user experience.

Continuing with the Soccer club app in the resources example, the following could represent the
app’s pages:

```yaml validate pages-snippet
pages:
  - name: Create strategy
    roles:
      - Manager
    blocks:
      - type: form
        version: 0.34.15
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
      - GroupMember
    blocks:
      - type: action-button
        version: 0.34.15
        parameters:
          icon: plus
        roles:
          - Manager
        actions:
          onClick:
            type: link
            to: Create strategy

  - name: Report absence
    roles:
      - Player
    blocks:
      - type: form
        version: 0.34.15
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
      - Manager
    blocks:
      - type: action-button
        version: 0.34.15
        parameters:
          icon: plus
        roles:
          - Player
        actions:
          onClick:
            type: link
            to: Report absence

  - name: About
    blocks:
      - type: html
        version: 0.34.15
        parameters:
          placeholders:
            summary: This is the groups app
          content: |
            <span data-content="summary" />
```

According to this app definition, only group members with the role `Manager` may view the pages
`Create strategy` and `View absence`. Only group members with the role `Player` may view the page
`Report absence`. Any app member may view the `Strategies` page, but on it only group managers see a
button which links to `Create strategy`. The `About` page is accessible to anyone.

## Actions

The following group related actions are can be used within an app:

- [`group.query`](../actions/groups.mdx#groupquery)
- [`group.member.invite`](../actions/groups.mdx#groupmemberinvite)
- [`group.member.query`](../actions/groups.mdx#groupmemberquery)
- [`group.member.delete`](../actions/groups.mdx#groupmemberdelete)
- [`group.member.role.update`](../actions/groups.mdx#groupmemberroleupdate)
