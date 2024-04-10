# Config

Sometimes, Appsemble apps need configurations separate from the app definition. These configurations
can come in the form of app variables or app secrets.

## Table of Contents

- [Variables](#variables)
- [Secrets](#secrets)
  - [Service secrets](#service-secrets)
  - [OAuth2 secrets](#oauth2-secrets)
  - [Saml secrets](#saml-secrets)
  - [SSL secrets](#ssl-secrets)
  - [SCIM secrets](#scim-secrets)
- [Defining config in code](#defining-config-in-code)
- [Defining config in the studio](#defining-config-in-the-studio)

## Variables

App variables are predefined key value pairs, that can be accessed from the app definition using the
`variable` remapper like so:

```yaml
object.from:
  my-variable-value: { variable: my-variable-name }
```

## Secrets

### [Service secrets](service.md)

### [OAuth2 secrets](oauth2.md)

### [Saml secrets](saml.md)

### [SSL secrets](tls.md)

### [SCIM secrets](scim.md)

## Defining config in code

From version `0.27.12` onwards, app variables and secrets can be defined in the `config` directory
in the app directory in their corresponding JSON files - `variables.json`, `secrets/service.json`,
`secrets/oauth2.json`, `secrets/saml.json`, `secrets/ssl.json` and `secrets/scim.json`. To hide
sensitive values, the pattern `{{ SECRET_VALUE }}` can be used and the value will be inferred from
`process.env`.

Variables and secrets defined in the config directory will automatically be created or updated when
publishing or updating an app with the `appsemble app publish` and `appsemble app update` commands.

### Examples

Variables, service secrets, OAuth2 secrets and SAML secrets must be defined in an JSON array of
objects. The SSL secret and the SCIM secret must be defined as a JSON object. Variable names and
generic secret names must be unique for the variable and secret remappers to work.

#### config/variables.json

```json
[
  {
    "name": "inline",
    "value": "my-value"
  },
  {
    "name": "from-process",
    "value": "{{ MY_VALUE }}"
  },
  {
    "name": "concatenated",
    "value": "{{ PREFIX }}.{{ SUFFIX }}"
  }
]
```

#### config/secrets/service.json

```json
[
  {
    "name": "pdf-generator-service-secret",
    "urlPatterns": "{{ SERVICE_URL_PATTERNS }}}",
    "authenticationMethod": "custom-header",
    "identifier": "Authorization",
    "secret": "{{ SERVICE_SECRET }}"
  },
  {
    "name": "certificate-secret",
    "urlPatterns": "{{ SERVICE_CERTIFICATE_URL_PATTERNS }}}",
    "authenticationMethod": "client-certificate",
    "identifier": "{{ SERVICE_IDENTIFIER}}",
    "secret": "{{ SERVICE_CERTIFICATE }}"
  }
]
```

#### config/secrets/oauth2.json

```json
[
  {
    "name": "oauth2-secret",
    "icon": "redhat",
    "scope": "email openid profile",
    "authorizationUrl": "{{ OAUTH2_AUTHORIZATION_URL }}",
    "tokenUrl": "{{ OAUTH2_TOKEN_URL }}",
    "userInfoUrl": "{{ OAUTH2_USER_INFO_URL }}",
    "remapper": [{ "prop": "email" }],
    "clientId": "{{ OAUTH2_CLIENT_ID }}",
    "clientSecret": "{{ OAUTH2_CLIENT_SECRET }}"
  }
]
```

#### config/secrets/saml.json

```json
[
  {
    "name": "saml-secret",
    "icon": "cloudflare",
    "idpCertificate": "{{ SAML_IDP_CERTIFICATE }}",
    "entityId": "{{ SAML_ENTITY_ID }}",
    "ssoUrl": "{{ SAML_SSO_URL }}",
    "nameAttribute": "name",
    "emailAttribute": "email"
  }
]
```

#### config/secrets/ssl.json

```json
{
  "key": "{{ SSL_KEY }}",
  "certificate": "{{ SSL_CERTIFICATE }}"
}
```

#### config/secrets/scim.json

```json
{
  "enabled": true,
  "token": "{{ SCIM_TOKEN }}"
}
```

## Defining config in the studio

App variables and secrets can be configured in the corresponding pages in the Appsemble studio.

When cloning a template app, app variables and secrets will be copied to the new app without their
secret values.
