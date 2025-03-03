This app demonstrates how to use the app webhooks functionality, allowing external parties to call
app endpoints with custom functionality, defined in the form of Appsemble actions.

After publishing the app, you can test the functionality by making a `POST` request to
`{apiUrl}/apps/${appId}/webhooks/createRecord`. As per the webhook's schema definition, the `foo`
property in the request body is required, while `pdf` and `xml` are optional. If you wish to send a
pdf and a xml file in the body, you must make a `multipart/form-data` request. If you only wish to
send `foo` in the body, you can also use `application/json`.

In order to be able to use the webhook, you must generate at least one webhook secret for the app.
You can do so from the studio. After generating a webhook secret, review its value in the studio and
copy it. You must provide it in an `Authorization` header in your `POST` request prefixed by
`Bearer `.
