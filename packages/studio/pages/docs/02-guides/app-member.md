# App Member

The users of an app are called `App Members`, the Appsemble platform has users that can build apps,
which can also be connected to App Members. Cr

- AppMember.ts
- AppOAuth2Authorization.ts
- AppOAuth2Secret.ts
- AppSamlAuthorization.ts
- AppSamlSecret.ts
- AppServiceSecret.ts
- EmailAuthorization.ts
- OAuth2AuthorizationCode.ts
- OAuth2ClientCredentials.ts
- OAuthAuthorization.ts
- ResetPasswordToken.ts
- SamlLoginRequest.ts
- GroupMember.ts
- Group.ts
- Theme.ts
- User.ts

```mermaid
sequenceDiagram
  participant App
  participant Appsemble Studio
  participant IDP
  Note right of App: User presses login button
  App->>Appsemble Studio: User is redirected
  Note right of Appsemble Studio: Studio prepares user login
  Appsemble Studio->>+IDP: User is redirected to the IDP
  Note right of IDP: User approves login
  IDP->>+Appsemble Studio: User is redirected to Appsemble Studio
  Appsemble Studio->>App: User is returned with Appsemble login code
  rect hsla(30, 30%, 30%, 0.5)
    Note over App,Appsemble Studio: This happens below the surface.
    App-->>Appsemble Studio: Get Appsemble token
    Appsemble Studio-->>App: Return Appsemble token
  end
  Note right of App: The user is now logged in.
```
