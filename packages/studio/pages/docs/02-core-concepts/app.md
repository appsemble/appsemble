# App

## Table of Contents

- [Introduction](#introduction)
- [Transfer](#transfer)
- [Users](#users)
  - [Guests](#guests)
  - [Members](#members)
- [Secrets](#secrets)
- [Settings](#settings)

## Introduction

An app in the Appsemble ecosystem is written using [YAML](yaml-syntax.mdx) and is intended to
provide the functionality of a fully fledged web app. An app consists of a definition, messages,
security definition, various types of secrets, associated settings and resources. An app definition
is the most important part of an app and allows you to structure your app and add functionality to
it. You can define a layout for your app, a security definition, schema for your data and much more
in your app. `AppMessages` allow you to enable
[internationalization](https://en.wikipedia.org/wiki/Internationalization_and_localization) for your
app. You can define a schema in your app definition that allows you to store and access data. Data
is securely stored in the Appsemble database. Data storage and resources are documented in detail
[here](storage.md). You can use either the [studio](studio.md) or `Appsemble CLI` to create or
update an existing app. A beginner is recommended to stick to studio and more advanced users with
prior experience can leverage the CLI. An app may consist of one or more pages where each page may
have one or more [blocks](/blocks). Blocks provide visual as well as functional capabilities to the
apps.

## Transfer

An app in Appsemble can be transferred out of the system as a zip file using the export feature,
which is available in the studio as well as the CLI. On the other hand, to import an app, you can
use the studio or the CLI to import an app from a zip file. To know more about how this works check
[here](basic-app.md#export-import). Another way to import an app into the system is using the
`app publish` command of the CLI to create an app from a folder or an app definition. Similarly, to
update an existing app, you can use the `app update` command.

---

**🛈NOTE**

> We are currently shuffling around with secrets and app settings. Some things stay at the app level
> whereas some go to organization level or they apply to all the apps in that organization.

---

## Users

### Guests

Guests are users of apps, who are interacting with it without an account. Their permissions can be
set by using the guest property in the app definition file. For more information check out
[security](./security.md).

### Members

App members are users of an apps, who have an account in it. Apps with a basic security definition
require you to be registered and logged in into the app. App members can perform various tasks
depending on the roles assigned to them and the app permissions that these roles have. For more
information check out [security](./security.md/#).

If you have enough organization permissions, you can access `AppMembers` of your app in the studio
on the `AppMember` page in the studio and even export the data as
[CSV](https://en.wikipedia.org/wiki/Comma-separated_values) file.

You can view which apps are connected to your Appsemble account at [Connected Apps](/settings/apps)
page.

## Secrets

Generally most of the app related setting like schema and roles are configured in the app definition
itself but due to security reasons and not exposing secrets and API keys to people with insufficient
permissions, secrets are configured separately. App secrets page can be accessed in the studio by
the users with sufficient permissions. This page allows you to configure multiple things like a
custom SMTP server, authentication with third party services, SSL certificates etc. It also allows
you to configure custom login methods for your app. You can enable or disable the default Appsemble
OAuth2 login method and self enable registration method. User has the option to authenticate a third
party service for their app in the `Service` section of the page. To know more about how this works
and how to set it up check [here](service.md). Similarly to enable the OAuth2 login using a third
party authentication system, you can enable and configure that using OAuth2 settings. Detailed
explanation about how this works and how this can be configured can be found [here](oauth2.md). Next
setting that you found on this page is to configure SAML login, which can be used to allow users to
login using SAML 2.0 IDP(Identity Providers) into your app. This is documented in detail
[here](saml.md). You also have an option to bring your own SSL certificate for your app. By default,
all apps are secured by [Let’s encrypt](https://letsencrypt.org/). To know about how this works and
how you can configure it check [here](tls.md). The final setting we have available on this page is
to enable and configure
[scim](https://en.wikipedia.org/wiki/System_for_Cross-domain_Identity_Management). SCIM allows you
to connect your identity management service with your app to have your users and data synchronized.
To know more about the configuration options and how it works in Appsemble check the detailed
documentation [here](scim.md).

From version `0.27.12` onwards, secrets can be defined in the `config/secrets` directory in the app
directory in their corresponding JSON files - `service.json`, `oauth2.json`, `saml.json`, `ssl.json`
and `scim.json`. For more information see [config.md](config.md).

## Settings

You can configure even more things about your app with sufficient
[permissions](../01-studio/organizations.mdx). Open the settings page of your app and you will find
the options to change the logo of your app, add a detailed description about your app which is
displayed in the details page of your app. You can also configure whether to make the app publicly
visible or restrict its visibility, similarly you have the option to hide or show the app definition
from users outside of your organization. You can set a `path` for your app which is generally parsed
from the name of your app set in the app definition, similarly, to use a custom domain for your app,
you can set the domain in `Domain name` field. We have the option to configure the name displayed
for the emails sent for the app. Google analytics field allows you to apply
[Google analytics](analytics.md#google-analytics) to your app. Sentry environments can be applied
and configured in the `Sentry DSN` and `Sentry Environment` fields. Finally we have the option to
set the `lock` for our app and delete your app. A locked can not be updated either way. Deleting an
app requires special permissions and this change can’t be reversed.
