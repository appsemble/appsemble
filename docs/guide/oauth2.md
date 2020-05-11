---
menu: Guide
route: /guide/security
---

# OAuth2

> **Note**: This is still under active development. It can’t be used yet.

Appsemble supports login using third party OAuth2 providers. Appsemble uses the authorization code
flow. To support this, the following information is needed:

| Field             | Required | Description                                                                                                                                           |
| ----------------- | :------: | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| App ID            |    ✔️    | This ID identifies Appsemble as a client for the third party system.                                                                                  |
| Secret            |    ✔️    | This proves the authenticity of Appsemble when it authenticates itself.                                                                               |
| Token URL         |    ✔️    | This is where Appsemble requests access tokens, which are then used to communicate with the third party servers.                                      |
| Refresh Token URL |          | If the authorization server uses refresh tokens, this URL indicates where Appsemble may refresh acceess tokens. Otherwise, this should be left empty. |
