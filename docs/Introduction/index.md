---
icon: home
---

# Appsemble Introduction

Welcome to the Appsemble app building tutorial. First this tutorial will give you the basic
understanding of Appsemble so that you will understand its concept. This tutorial will also help you
to create your first Appsemble account.

Here a short tutorial on how to set up your account and organization:

- [Set up Account and Organization](account_setup.md)

## Introduction Appsemble App

An App in Appsemble is constructed in the data serialization language YAML. The main reason YAML is
chosen is because it is an easy to read code and is also generally used for this kind of
configuration-like-applications and scripts. The best way to learn how YAML works for Appsemble is
to look into some of the example applications in the
[Appsemble App Store](https://appsemble.app/nl/apps). You can find a lot of information on the
internet about YAML.

You can build an App with elements like Resources, Blocks, Roles, etc which are pieces of code which
you can add (copy paste) and adjust.

In the App store you can open an app by clicking on an app in the app overview. Then you can view
the code of that app via the Editor in the left menu. For the best examples you can start with apps
from Appsemble itself.

![App Store Menu](../../config/assets/tutorial_assets/EN/Editor_menu.png 'App Store Menu')

## The building blocks of an Appsemble App

An app consists of a page or multiple pages. Always define the default page for the app to start in.

An app can consist of the following elements:

![app elements](../../config/assets/tutorial_assets/EN/Appsemble_app_elements_diagram.png 'app elements')

- name (name of the app)\*
- description (description of the app)
- `defaultPage` (app `startingpage`)\*
- pages (list of pages in the app)\*
- blocks (list of blocks in the app)
- resource (the resources where you store and collect your data)
- security (also user rights)
- roles (who can use the app)
- layout
- themes (to tweak the general style of the app)

The starred items are minimum required. The following is an explanation of the most commonly used
elements.

- [Blocks](blocks.md)
- [Resources](resources.md)

## Conclusion Introduction

As you have seen, reading YAML code is not that hard if you understand the basics. However, to
create a fully working app from scratch is still quite a challenge after studying this manual. What
you should be able to do is understand how existing apps work and you should also be able to look at
documentation in the Block Store. We recommend that you take a look at some existing apps and even
clone them. Try making changes to the configuration in the App Definition and see if the app behaves
the way you want it to. Once you have done that, you can take it to the next step and try to build
an app yourself.
