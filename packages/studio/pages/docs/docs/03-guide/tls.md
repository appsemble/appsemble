# TLS

## Table of Contents

- [Introduction](#introduction)
- [Custom certificates](#custom-certificates)
  - [Obtaining a certificate](#obtaining-a-certificate)

## Introduction

TLS stands for Transport Layer Security. It’s successor to the widely known Secure Sockets Layer
(SSL). The protocol is widely used in securing HTTPS websites.

Appsemble supports securing your app using TLS/SSL certificates.

By default, we secure your applications using [Let’s Encrypt]. There’s nothing you have to do to
obtain this. It’s applied automatically for each new app.

You can also opt to bring your own certificates.

## Custom certificates

You can configure a custom certificate for your app. Make sure you also read up on [DNS](dns.md),
it’s related.

In the Studio, select your App, then Secrets, then find the SSL segment. Here you can submit your
private and public certificates. If you already have these certificates, upload them here and you’ll
be done.

It’s not required, but some security checkers insist you make sure the public certificate is fully
resolvable and contains the full chain (including the Root Certificate). You can use a website like
[What’s My Chain Cert?] to obtain it.

### Obtaining a certificate

In case you don’t have a certificate yet. Find a vendor that provides you one. You’ll have to create
a CSR (Certificate Signing Request) to get started. Your vendor should have instructions for it.

[let’s encrypt]: https://letsencrypt.org
[What’s My Chain Cert?]: https://whatsmychaincert.com
