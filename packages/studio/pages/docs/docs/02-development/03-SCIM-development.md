# SCIM Development

## How does SCIM work?

When someone connects their identity management service to an Appsemble app using SCIM, their users
will get synchronized with the target application. Whenever the service wants to create, update or
delete a user the schema is first checked if it complies with the SCIM standards. These calls follow
a certain standard with how incoming and outgoing data should look like.

Incoming data from the identity service should be mapped to Appsemble models as much as possible.
For example, a SCIM username is mapped to `AppMember`.email. Sometimes this isn’t directly possible,
in which case you can create a new property in the relevant model. For example, `externalId` is
mapped to `AppMember`.scimExternalId. Custom SCIM properties should follow the format of
`scim{Property}`. The supported attribute mappings are found [below](#supported-attribute-mappings).

When developing SCIM further, please refer to official documentation as there are strict
requirements to follow. A good resource can be found
[here](https://learn.microsoft.com/en-us/azure/active-directory/app-provisioning/use-scim-to-provision-users-and-groups).

## How to fully test the implementation

While working on the SCIM endpoint there are a number of external testing methods to choose from.
The [SCIM validator](#scim-validator) and [Azure Active Directory](#azure-active-directory) methods
require the endpoint to be visible to the outside, instead of using localhost. One of the methods to
do this locally is to use [ngrok](https://ngrok.com/).

With ngrok installed, you can forward your localhost port to a public address by specifying the
port. For example, by typing `ngrok http 9999` for Appsemble. When starting Appsemble locally, you
then have to specify the generated address from ngrok using the `--host` flag.

- ### SCIM validator

  The [SCIM Validator](https://scimvalidator.microsoft.com) is a website where you can test various
  aspects of the SCIM endpoint. You can test with default attributes, have the validator
  automatically discover the schema or you can upload your schema. The validator checks the endpoint
  against a series of tests. You can configure this further by checking which attributes to include.

- ### Postman

  Microsoft offers a set of tests which can be loaded into Postman. By importing the following link:
  <https://aka.ms/ProvisioningPostman> into Postman, you get access to a set of standardized tests.
  More information about these tests and how to set up the testing environment can be found
  [here](https://learn.microsoft.com/en-us/azure/active-directory/app-provisioning/scim-validator-tutorial#use-postman-to-test-endpoints-optional).

- ### Azure Active Directory

  You can
  [join the Microsoft 365 developer program](https://learn.microsoft.com/en-us/azure/active-directory/develop/test-setup-environment#join-the-microsoft-365-developer-program-recommended)
  to get access to a free Azure AD developer environment with fake users and groups. This way, you
  can test your endpoint as if it’s being used in a professional environment. You can also see what
  it looks like on the Azure side. By following the [SCIM configuration](/docs/03-guide/SCIM) guide,
  you can set up your own SCIM connection and test it out.

## Supported attribute mappings

At the moment, Appsemble supports the following “customappsso Attributes”:

| SCIM target attribute                                              | Appsemble mapped attribute             |
| ------------------------------------------------------------------ | -------------------------------------- |
| externalId                                                         | `AppMember`.scimExternalId             |
| userName                                                           | `AppMember`.email                      |
| active                                                             | `AppMember`.scimActive                 |
| name.formatted                                                     | `AppMember`.name & `User`.name &       |
| locale                                                             | `User`.locale                          |
| timezone                                                           | `User`.timezone                        |
| urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:manager | `Team`.name = (Manager) `AppMember`.id |
