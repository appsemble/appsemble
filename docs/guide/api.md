# API

The Appsemble API is defined using OpenAPI 3. The SwaggerUI API explorer can be found
[here](/api-explorer).

**Note**: Appsemble is still under active development. API calls may change in breaking ways.

## Authorization

For third party clients, Appsemble uses the OAuth2 client credentials grant type. For example the
official [Appsemble CLI](https://www.npmjs.com/package/@appsemble/cli) client credentials to
authenticate.

Appsemble client credentials can be registered under
[client credentials](/settings/client-credentials) in user settings. Registering client users will
output the client id and client secret as `client_id:client_secret`.

The client credentials may be used to request an access token. For example:

```http
POST /oauth2/token HTTP/1.1
Accept: application/json
Authorization: Basic {client_id}:{client_secret}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope={my_scope}
```

This will return the following response:

```json
{
  "access_token": "your.access.token",
  "expires_in": 3600,
  "token_type": "bearer"
}
```

The access token in the response can be used as a bearer HTTP header to authorize the request. For
example to query the resources of an app:

```http
POST /api/apps HTTP/1.1
Accept: application/json
Authorization: Bearer your.access.token
Content-Type: multipart/form-data; boundary=serighfcjqwopeh

--serighfcjqwopeh--
Content-Disposition: form-data; name="app"

{
  "name": "Empty",
  "defaultPage": "Page A"
  "pages": [
    {
      "name": "Example Page A",
      "blocks": [
        {
          "type": "action-button",
          "version": "0.17.3",
          "parameters": {
            "icon": "plus"
          },
          "actions": {}
        }
      ]
    }
  ]
}
--serighfcjqwopeh
Content-Disposition: form-data; name="OrganizationId"

appsemble
--serighfcjqwopeh
```
