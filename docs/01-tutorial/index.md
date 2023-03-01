---
icon: home
---

# Appsemble Tutorial

Welcome to the Appsemble Tutorial. Appsemble is one of the few open source low-code platforms.
Without being a programmer you can build apps for your phone or tablet; faster, cheaper and far more
flexible. With Appsemble you have access to other existing apps in the app store. You can use these
apps as a template to configure your own app. Next to that you can also use the different building
blocks from the block store to add more features to your app. This introduction will explain what
Appsemble is and will show you how you can start working in Appsemble so you can start building your
first app.

This tutorial will give you the basic understanding of Appsemble so that you will understand the
concept of Appsemble.

Here a short tutorial on how to set up your account and organization:

- [Set up Account and Organization](01-account-setup.md)

## Introduction Appsemble App

An App in Appsemble is constructed in the data serialization language YAML. The main reason YAML is
chosen is because it is an easy to read code and is also generally used for this kind of
configuration-like-applications and scripts. The best way to learn how YAML works for Appsemble is
to look into some of the example applications in the
[Appsemble App Store](https://appsemble.app/nl/apps). You can find a lot of information on the
internet about YAML.

You can build an App with elements like Resources, Blocks, Roles, etc which are pieces of code which
you can add and adjust.

In the App store you can open an app by clicking on an app in the app overview. Then you can view
the code of that app via the Editor in the left menu. For the best examples you can start with apps
from Appsemble itself.

![App Store Menu](../../config/assets/tutorial-assets/editor-menu.png 'App Store Menu')

## The building blocks of an Appsemble App

An app consists of a page or multiple pages. Always define the default page for the app to start in.

An app can consist of the following elements:

![app elements](../../config/assets/tutorial-assets/appsemble-app-elements-diagram.png 'app elements')

- name (name of the app)\*
- description (description of the app)
- `defaultPage` (app `startingpage`)\*
- pages (list of pages in the app)\*
- blocks (list of blocks in the app)\*
- resource (the resources where you store and collect your data)
- security (also user rights)
- roles (who can use the app)
- layout
- themes (to tweak the general style of the app)

The starred items are the minimum required pieces for building a functional app.

## Conclusion

As you have seen, reading YAML code from the examples and existing apps is not that hard now that
you understand the basics of Appsemble. To get to the next step and build an app yourself we
recommend that you take a look at the existing apps in the
[App Store](https://appsemble.app/en/apps). You can clone an app and try to make changes to the
configuration of the App. See if the app behaves the way you want it to.

- [Next: Account setup](01-account-setup.md)
