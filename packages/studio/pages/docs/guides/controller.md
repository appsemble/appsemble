# Controller

## Table of Contents

- [Introduction](#introduction)

## Introduction

Controllers are a mechanism in Appsemble that can be used to add custom logic to an app, without
creating a block. Controllers, just like blocks, can define actions, events and parameters that they
support. They are intended for application logic and intentionally do not support interface logic. A
controller is bound to an app instance, is uploaded along with the app definition when creating the
app, and cannot be reused in other apps.

The controller of an app is defined in a subdirectory of the app directory called `controller`. This
directory resembles a block project. Inside it there should be a `src/index.ts` file, which contains
the `controller` function, which is similar to the `bootstrap` function of a block. There can also
exist a file called with an arbitrary name, e.g. `controller.ts`, that augments the interfaces
defined in `@appsemble/sdk` to allow app developers to define custom actions, parameters and events.

One difference between the bootstrap function of a block and the controller function is, that the
controller function returns handler functions, based on the augmented interfaces, that can be called
from a block in the app definition:

```typescript copy
import { controller } from '@appsemble/sdk';

controller(({ events }) => ({
  calculate(data: { a: number; b: number; operation: 'addition' | 'multiplication' }): void {
    const { a, b, operation } = data;

    let result;
    switch (operation) {
      case 'addition':
        result = a + b;
        break;
      case 'multiplication':
        result = a * b;
        break;
      default:
        result = Number.NaN;
        break;
    }

    events.emit.data({ result });
  },
}));
```

In an app definition a controller can be defined as follows:

```yaml copy filename="app-definition.yaml" validate
name: controller-demo
description: This app demonstrates the app controller functionality
defaultPage: Example Page A

controller:
  events:
    emit:
      data: calculationResult

pages:
  - name: Example Page A
    blocks:
      - type: form
        version: 0.35.13
        parameters:
          fields:
            - name: a
              type: number
              label: { translate: firstNumber }
            - name: b
              type: number
              label: { translate: secondNumber }
            - name: operation
              type: enum
              label: { translate: operation }
              enum:
                - value: addition
                - value: multiplication
        actions:
          onSubmit:
            type: controller
            handler: calculate

      - type: detail-viewer
        version: 0.35.13
        parameters:
          fields:
            - value: { prop: result }
              label: Calculation Result
        events:
          listen:
            data: calculationResult
```

In the example above, when triggering the `onSubmit` event of the form block, the `controller`
action is triggered, pointing to the handler function in the controller called `calculate`. The
handler function takes the data passed from the action, performs a calculation, and emits the
`calculationResult` event. The `detail-viewer` block listens for that event and displays the
calculation result on the screen.

The code snippets are taken from the `controller` app, you can examine it in more detail if needed.
