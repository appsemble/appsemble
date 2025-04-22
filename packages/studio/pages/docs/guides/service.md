# Services

It’s common to connect to external web services from your Appsemble app. Often, web services require
some way to authenticate when requesting data.

In Appsemble, you can request data from other web services using the
[request action](../reference/action.mdx#request). To authenticate request actions so data can be
requested from a secured service, the `App Service Secrets` should be used to securely store them.

`App Service Secrets` allow you to set a URL (or URL pattern) that matches with the URL defined in
the request action that then authenticates your requests automatically if any predefined credentials
were found.

> Note: This feature requires the request to be proxied through the Appsemble server. This is
> enabled by default, or you can set it to `true` manually with the
> [proxy](../reference/action.mdx#request-proxy) property. If this is set to `false` the request
> won’t be passed through the Appsemble API to authenticate the request.

## Table of Contents

- [Security configuration](#security-configuration)
- [URL matching](#url-matching)
  - [Special characters](#special-characters)
- [Authentication methods](#authentication-methods)
  - [HTTP basic authentication](#http-basic-authentication)
  - [Client certificate](#client-certificate)
  - [OAuth2 Client credentials](#oauth2-client-credentials)
  - [Cookie authentication](#cookie-authentication)
  - [Header based authentication](#header-based-authentication)
  - [Query parameter](#query-parameter)

## Security configuration

> Important: only use service secrets without a security definition at your own risk, anyone
> accessing the app may be able to use your external service without authentication. Consider using
> obfuscation or other ways of protecting your services.

The app should have a security definition and app roles defined, but will still work without them.

Service secrets will still be applied without a security definition or app roles, when opted into
`Unsecured Service Secrets`. If a security definition is defined. The app service secrets will be
applied based on the security policy. Service secrets by default are not applied to the
unauthenticated requests, i.e. if an app defines a security definition and no app member is logged
in when the request action is executed, no secrets will be applied. To change this behaviour, a user
can select the `public` checkbox in the studio or set the `public` field in the config file to true
when publishing the app.

See [Security](../app/security.md) for more on the security definition and policies.

## URL matching

To make sure you select what request action should be authenticated and which should not, a set of
URL matching patterns can be defined. This simply means the URL that is defined in the request
action you want to authenticate should be the same as the URL used for the secret required for
authentication.

```yaml
https://api.example.com/
```

The action that will be authenticated:

```yaml
type: request
url: https://api.example.com/
```

### Special characters

You can also use the `*` and `!` characters to allow certain parts of the URL to be matched.

The `*` symbol allows any characters to be matched before, between, or after a part of the URL you
want to use, like so:

```yaml
https://example.com/v1/*, *example.com/v1/api, https://example.com/v2/api/items/*/box
```

The following request actions all get authenticated with the secret:

```yaml
type: request
url: https://example.com/v1/test123
---
type: request
url: http://example.com/v1/api
---
type: request
url: https://example.com/v2/api/items/5/box
```

The following request actions do `not` get authenticated with the secret:

```yaml
type: request
url: https://test.example/
---
type: request
url: http://example.com/v1/api/test
---
type: request
url: https://example.com/v2/api/items/5/box/type
```

> Important: Its best to only use this after the domain, so after <https://example.com/>, this is to
> prevent accidentally sending your secrets to a service that you do not trust with those specific
> secrets.

> Note: Using only the following symbol `!` will authenticate any request action, but the one with
> the specified URL. It’s best to use this together with another URL that does not use this symbol
> to prevent authenticating the wrong requests.

The `!` symbol can be used at the start of a URL pattern to make an entry not match, so everything
will be allowed except the URL pattern, like so:

```yaml
!https://foo.example.com/ , https://*.example.com/
```

Does `not` get authenticated with the secret:

```yaml
type: request
url: https://foo.example.com/
```

Does get authenticated with the secret:

```yaml
type: request
url: https://api.example.com/
```

## Authentication methods

Appsemble supports different ways to authenticate outgoing requests (towards an external service).
These methods all require some secret and a name or identifier field for the secret to be specified.
All secrets (passwords, private keys, etc) will be encrypted and are not retrievable after uploading
in the secrets page.

- [HTTP basic authentication](#http-basic-authentication)
- [Client certificate](#client-certificate)
- [OAuth2 client credentials](#oauth2-client-credentials)
- [Cookie authentication](#cookie-authentication)
- [Header based authentication](#header-based-authentication)
- [Query parameter](#query-parameter)

> Note: You can authenticate the same request action with multiple service secrets. However not all
> methods are compatible; The options `HTTP basic authentication`, `OAuth2 client credentials`, and
> `Header` may interfere with each other as the request only allows for 1 Authorization header to be
> specified, which basic and client credentials always use and header may use. `Client certificates`
> can also only be applied once.

### HTTP basic authentication

HTTP basic authentication requires a username and password to be set. These will be encoded as a
base64 string and added to the request using the `Authorization` header.

```http
Authorization: Basic <credentials>
```

For more please refer to: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication>

### Client certificate

This option requires a (x509) certificate to be set and its private key. The certificate should be
trusted by the API you want to request data from.

The option is also referred to as Mutual-TLS, which acts as an extra security measure verifying the
servers’ identity using public certificates.

The certificate and private key are expected to be in `.pem` format.

For more please refer to: <https://www.rfc-editor.org/rfc/rfc8705.html#section-2.1>

> Note: Do not set a passphrase when requesting or self-signing the certificate as this will require
> an extra decryption step that Appsemble currently doesn’t support.

### OAuth2 Client credentials

The OAuth client credentials option requires a client ID, client secret and a token URL to be set to
request an access token. This token is stored and refreshed based on the expiry time.

This flow uses HTTP basic authentication under the hood to retrieve an access token with the client
ID as username and client secret as password from the token URL. The same request action will use
the same token until 10 minutes before it expires, which by then the next request will retrieve a
new token.

For more please refer to: <https://www.rfc-editor.org/rfc/rfc6749.html>

### Cookie authentication

Cookie authentication allows for a cookie name and secret to be specified. Multiple cookies are
allowed at the same time. Currently, adding attributes is not directly supported.

The cookie will be set with the `Set-Cookie` header.

```http
Set-Cookie: <cookie-name>=<cookie-value>
```

For more please refer to: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers>

> Warning: Using cookie authentication is prone to being logged on the server, so if possible use
> other methods if this is a concern.

### Header based authentication

Header based authentication allows a custom header name and secret to be specified. Multiple custom
headers are allowed at the same time.

For more please refer to: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers>

> Warning: Using header based authentication is prone to being logged on the server, so if possible
> use other methods if this is a concern.

### Query parameter

The query parameter option allows a search parameter name and secret value to be specified. Multiple
query secrets are allowed at the same time.

In the following URL, you can identify the secret to authenticate with as `authKey=secret`:

```http
https://api.pro6pp.nl/v2/autocomplete/nl?authKey=secret&postalCode=Example&houseNumber=Example
```

> Warning: Using the query parameter option is prone to being logged on the server, so if possible
> use other methods if this is a concern.
