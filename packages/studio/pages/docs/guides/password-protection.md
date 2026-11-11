# Password protection

An app can require a password before it opens, for example while a closed group of people tests it.
Everyone who opens the app enters the same password.

## Table of Contents

- [Turning password protection on and off](#turning-password-protection-on-and-off)
- [Sharing the password](#sharing-the-password)
- [What is protected](#what-is-protected)
- [Related settings](#related-settings)

## Turning password protection on and off

Password protection is a setting of the app, not part of the app definition. Publishing a new
version of the app definition does not change it.

1. Open the app in Appsemble Studio and go to **Settings**.
2. Check **Password protection** and enter a password.
3. Click **Save changes**.

To change the password, enter a new one and save. To turn password protection off, uncheck
**Password protection** and save.

## Sharing the password

Send the testers the link to the app and the password. When they open the app, the browser asks for
a username and a password. Any username is accepted.

Changing the password revokes the access of everyone who used the old password. Share the new
password with the people who should keep access.

## What is protected

Password protection covers:

- Every page and file on the domains of the app, including a custom domain.
- The content the app loads from the Appsemble API, such as the app definition, translations,
  resources, assets, variables and styles.

Members of the organization of the app keep working with it in Appsemble Studio. The app preview in
Studio loads the app the way a visitor does, so the browser asks for the password there as well.

The following stay reachable without the password:

- The name, description, icon, screenshots, readme and ratings of the app. The
  [visibility](../app/security.mdx#app-privacy) of the app decides where these are listed.
- Requests from other systems that never open the app: [webhooks](webhooks.mdx) called with a
  webhook secret, [SCIM](scim.md), and the responses of [SAML](saml.md) identity providers and
  payment providers.

## Related settings

- **Visibility**: Visibility decides where the app is listed, password protection decides who can
  open it. Set the visibility to unlisted or private to keep a password protected app out of the app
  store.
- **Show app definition**: Visitors without the password cannot see the app definition, even if this
  setting is checked.
- **App login**: Password protection comes before [app login](../app/security.mdx). Visitors first
  enter the shared password, then log in with their own account if the app asks for it. Links in
  invitation and verification emails open the app, so the people who receive them need the password
  too.
