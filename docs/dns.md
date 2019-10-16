---
menu: Development
---

# DNS

DNS stands for _Domain Name System_. This is what links a domain name to a website.

Appsemble supports linking custom domain names to an app. The first step is to get a domain name.

> **Note**: Whether or not Appsemble has support for custom domain names, depends on how it is
> hosted. It _is_ supported on [appsemble.app].

## Configure CNAME

Create a CNAME record that links `@` to the Appsemble URL.

For example, to link your top level domain name to your app on _appsemble.app_, add the following
DNS record. The exact settings screen may vary per registrar.

| Type  | Name | Target        | TTL  |
| ----- | ---- | ------------- | ---- |
| CNAME | @    | appsemble.app | Auto |

> **Note**: Not all registrars can handle top level domain name CNAME records. For these domain
> names, we suggest using [Cloudflare]. No worries, registration is free.

To link a subdomain, for example `my-app`, to an app, add the following configuration.

| Type  | Name   | Target        | TTL  |
| ----- | ------ | ------------- | ---- |
| CNAME | my-app | appsemble.app | Auto |

## Configure App

For Appsemble to know which app should be served on the given domain name, it should know which app
to serve when it receives a request on this domain name.

In the app settings of your app, enter the domain name in the _Domain_ field and save.

It may take up to a day until a domain name has been linked successfully, although in practice this
will only take minutes.

[appsemble.app]: https://appsemble.app
[cloudflare]: https://www.cloudflare.com
