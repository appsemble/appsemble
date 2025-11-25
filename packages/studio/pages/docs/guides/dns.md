# DNS

## Table of Contents

- [Introduction](#introduction)
- [Configure CNAME](#configure-cname)
- [Configure CAA](#configure-caa)
- [Configure app](#configure-app)

## Introduction

DNS stands for _Domain Name System_. This is what links a domain name to a website.

Appsemble supports linking custom domain names to an app. The first step is to get a domain name.

> **Note**: Whether or not Appsemble has support for custom domain names, depends on how it is
> hosted. It _is_ supported on [appsemble.app].

## Configure CNAME

Create a CNAME record that links `@` to the Appsemble URL.

For example, to link your top level domain name to your app on _appsemble.app_, add the following
DNS record. The exact settings screen may vary per registrar.

| Type  | Name | Target           | TTL  |
| ----- | ---- | ---------------- | ---- |
| CNAME | @    | `appsemble.app.` | Auto |

> **Note**: Not all registrars can handle top level domain name CNAME records. For these domain
> names, we suggest using [Cloudflare]. No worries, registration is free.

To link a subdomain, for example `my-app`, to an app, add the following configuration.

| Type  | Name   | Target           | TTL  |
| ----- | ------ | ---------------- | ---- |
| CNAME | my-app | `appsemble.app.` | Auto |

## Configure CAA

A CAA record defines what Certificate Authority (CA) is allowed to hand out certificates for your
(sub)domain.

If you're unsure whether you have a CAA record, find out using [CAA Lookup].

If you host your app on _appsemble.app_, we need you to support certificates handed out by [Let’s
Encrypt]. To allow this for your (sub)domain, you add an extra CAA record like this:

| Type | Name | Target                      |
| ---- | ---- | --------------------------- |
| CAA  | @    | `0 issue "letsencrypt.org"` |

Alternatively, you also permit the _letsencrypt.org_ CA for one subdomain, for example
`app.your.domain`:

To link a subdomain, for example `my-app`, to an app, add the following configuration.

| Type | Name | Target                      |
| ---- | ---- | --------------------------- |
| CAA  | app  | `0 issue "letsencrypt.org"` |

Read more on certificates and Appsemble from [TLS](tls.md).

## Configure app

For Appsemble to know which app should be served on the given domain name, it should know which app
to serve when it receives a request on this domain name.

In the app settings of your app, enter the domain name in the _Domain_ field and save.

It may take up to a day until a domain name has been linked successfully, although in practice this
will only take minutes.

[appsemble.app]: https://appsemble.app
[cloudflare]: https://www.cloudflare.com
[caa lookup]: https://www.nslookup.io/caa-lookup
[let’s encrypt]: https://letsencrypt.org
