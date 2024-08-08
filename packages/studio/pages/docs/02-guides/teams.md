# Teams

## Table of Contents

- [Introduction](#introduction)
- [Roles](#roles)
  - [Resources](#resources)
  - [Pages](#pages)
- [Actions](#actions)

## Introduction

Teams can be used to organize groups of members in an app. Typically teams represent users that are
linked together somehow. For example they belong to the same organizational unit or they are
classmates. App managers can view and manage teams from the _Teams_ page in the app page in
Appsemble Studio. In order to become a team member, a user must first be registered as an app
member. A user can do so by logging into the app. Teams determine how its members can share
resources with each other.

To enable teams, first `security.teams` needs to be enabled in the app definition. For more
information, see [teams security](security.md#teams)

## Roles

Within a team a user has one of the roles _Manager_ or _Member_. The exact difference between these
roles is determined by the security roles in the app definition. From a security perspective it’s
most important to configure resource roles correctly. For a good user experience, it’s best to make
sure the app pages match the resource security definitions.

### Resources

If a resource `create` definition specifies a role of `$team:manager`, only a user who is a manager
of a team may create such a resource. If the role is `$team:member`, only a user who is a team
member may create such a resource. The latter includes the team manager.

If a resource action definition other than `create` specifies a role of `$team:member`, then any
team member of the resource author may perform the action on that resource. If the role is
`$team:manager`, then only the managers of the team the author is in may perform that action on the
resource.

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
        - $team:manager
    query:
      roles:
        - $team:member
    get:
      roles:
        - $team:member

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
        - $team:member
    query:
      roles:
        - $team:manager
    get:
      roles:
        - $team:manager
```

We have the following teams:

**Red team**:

- Manny (manager)
- James
- Alex

**Blue team**:

- Mandy (manager)
- Jessie
- Alex

Each soccer team has their own strategy. Only the team manager may create a strategy. Manny may
create a strategy (`$team:manager`), meaning they are now the author of that strategy. Because James
and Alex are in the same team as Manny, they may view the strategy (`$team:member`).

Mandy is the manager of the blue team. This means they can also create a strategy (`$team:manager`),
which can then be viewed by Jessie and Alex (`$team:member`). Because Alex is in both the red and
the blue team, Alex can see both strategies.

Sometimes players (represented by team members) can’t be present at a game. In this case they need
to report themselves absent. Players can only report their own absence (`$team:member`) using a
create action. Let’s say Jamie calls in sick. Now only Manny can see this (`$team:manager`).
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
      - $team:manager
    blocks:
      - type: form
        version: 0.29.8
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
      - $team:member
    blocks:
      - type: action-button
        version: 0.29.8
        parameters:
          icon: plus
        roles:
          - $team:member
        actions:
          onClick:
            type: link
            to: Create strategy

  - name: Report absence
    roles:
      - $team:member
    blocks:
      - type: form
        version: 0.29.8
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
      - $team:manager
    blocks:
      - type: action-button
        version: 0.29.8
        parameters:
          icon: plus
        roles:
          - $team:member
        actions:
          onClick:
            type: link
            to: Report absence

  - name: About
    blocks:
      - type: html
        version: 0.29.8
        parameters:
          placeholders:
            summary: This is the teams app
          content: |
            <span data-content="summary" />
```

According to this app definition, only the team manager may view the pages called `Create strategy`
and `View absence`. Any team member may view the `Strategies` and `Report absence` pages, but on the
`Strategies` page, only team managers see a button which links to `Create strategy`. This means
anyone who isn’t part of a team can’t see any of those pages. The `About` page is accessible to
anyone.

## Actions

The following team related actions are can be used within an app:

- [`team.invite`](../actions/03-teams.mdx#teaminvite)
- [`team.join`](../actions/03-teams.mdx#teamjoin)
- [`team.list`](../actions/03-teams.mdx#teamlist)
- [`team.members`](../actions/03-teams.mdx#teammembers)
