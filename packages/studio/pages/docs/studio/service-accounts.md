# Service accounts

A service account lets a CI pipeline, a deployment script or another non-interactive client use the
Appsemble API on behalf of an [organization](organizations.mdx). It authenticates with OAuth2 client
credentials, like the [personal client credentials](/settings/client-credentials) of a platform
user, but it does not belong to a person.

Personal client credentials act as the person who created them: they stop working when that person
leaves the organization, and in an organization that requires single sign-on they depend on that
person's single sign-on session. Use a service account for automation that has to keep working on
its own, such as deploying apps from CI.

## Rules

- A service account belongs to one organization and has one role in it. The role can be any
  organization role except `Owner`.
- The organization's [single sign-on policy](organizations.mdx#single-sign-on) does not apply to
  service accounts.
- A service account cannot sign in to the Studio. It only uses the API with its client credentials.
- The organization's members page lists service accounts separately from people.

## Creating a service account

Owners create service accounts on the organization's **Members** page:

1. Select **Create service account**.
2. Enter a description, for example the name of the pipeline that uses it.
3. Select the role. The role decides what the service account may do in the organization.
4. Optionally enter an expiry date.
5. Select the scopes. The scopes decide which parts of the API the client credentials may use, for
   example `apps:write` to publish and update apps, or `blocks:write` to publish blocks.
6. Select **Create**.

The Studio shows the client credentials as `client_id:client_secret` once. Store them in a secret
variable of the client that uses them; the Studio cannot show the secret again.

A [Helm installation](../deployment/helm.md#provisioning) can also provision a `Maintainer` service
account for its organization from client credentials in a Kubernetes secret.

## Using a service account

The [Appsemble CLI](/docs/packages/cli) reads client credentials from the `--client-credentials`
option or from the `APPSEMBLE_CLIENT_CREDENTIALS` environment variable:

```sh
appsemble --client-credentials "$CLIENT_ID:$CLIENT_SECRET" app update --id 123 apps/my-app
```

In a CI pipeline, store the client credentials in a masked secret variable named
`APPSEMBLE_CLIENT_CREDENTIALS`. For example in GitLab CI:

```yaml
deploy:
  image: node:24
  script:
    - npx @appsemble/cli --remote https://appsemble.app app update --id 123 apps/my-app
```

Other clients request an access token with the client credentials grant, as described in the
[API guide](../guides/api.md#authorization).

## Revoking and expiry

Owners revoke a service account with **Revoke** on the organization's **Members** page. A revoked or
expired service account loses access at once, including access tokens it already received.

To replace the client credentials, create a new service account, update the secret variable of the
client, and revoke the old service account.
