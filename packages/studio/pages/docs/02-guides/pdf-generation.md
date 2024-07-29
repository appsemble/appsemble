# Generating PDF documents

This guide will explain how to generate PDF documents based on a certain template. To understand
this guide better it is recommended to take a look at the
[companion containers](./companion-containers.md) guide.

If you are unfamiliar with some of the concepts mentioned, make sure to check the Appsemble
documentation. Relevant guides are linked within this one.

## Requirements

To print a PDF document, you will need:

- Companion container running the PDF generator image
  - A secret, used for authenticating to the API
- Template document for the PDF document

## Creating PDF generator companion container

To create a companion container, you need to provide `name`, `image`, and `port` as mandatory
parameters:

```yaml
containers:
  - name: pdf-generator
    image: registry.gitlab.com/appsemble/apps/eindhoven/pdf-generator-api:main
    port: 3000
```

**Note:** the port used is determined by the Docker image, on which it is based.

For this specific image, a few additional settings are required.

```yaml
containers:
  - name: pdf-generator
    image: registry.gitlab.com/appsemble/apps/eindhoven/pdf-generator-api:main
    port: 3000
    env:
      - name: SECRET
        value: secret
        useValueFromSecret: true
      # The name of the appsemble domain you are using
      - name: REMOTE
        value: https://appsemble.app
      # Id of your app
      - name: APP_ID
        value: '36'
```

- `env` - Here you can define the environment variables:
  - `SECRET` - This is important for authentication. Value should be the name of the secret created
    in the `secrets` page.
  - `REMOTE` - The name of the Appsemble domain used to run the Studio. Required to make the call
    back to Appsemble to fetch the PDF template. E.g., when using the offical Appsemble instance
    (production), this should be `https://appsemble.app`. For self-hosted instances, this value
    depends on what the `ingress.host` is set to. In the
    [local Kubernetes guide](../development/custom-apis-local-kubernetes.md), this value is set to
    `appsemble`, then the value for the `REMOTE` property should be `http://appsemble`.
  - `APP_ID` - The id of your app, also required for fetching the template.

After publishing the app definition, the container with the PDF generator will be created, however,
it is not ready for use yet.

## Creating the secret

The PDF generator image requires a secret to be set before starting. This secret is required for
authentication when sending requests later. To learn more about secrets, refer to the
[secrets](./App.md#secrets) guide and for setup refer to the
[service secrets](./service.md#header-based-authentication) guide.

In short, a service secret needs to be created from the `secrets` page with the following paramters:

- `Name` - "secret"
- `URL patterns` - "http://\*" (don't forget to press enter afterwards). This pattern will apply
  this header to all outgoing requests using "http" which is the case with Companion Containers. If
  your app needs to authenticate with more than one API, or has more than one secrets, refer to the
  [url pattern rules](./service.md#url-matching) page
- `Authentication method` - "Header based authentication"
- `Header` - "Authorization"
- `Secret` - Any value you want

After creating the secret, the PDF generator container should be ready to use. You can perform a
healthcheck to make sure, by sending a request to the `/health` endpoint. The
[container remapper](../remappers/data.mdx#container) comes in handy for this:

```yaml
    type: request
      url: {container: pdf-generator/health}
      proxy: true
      method: get
    onSuccess:
      type: message
      body: "Healthcheck successful!"
      color: success
    onError:
      type: message
      body: "Healthcheck failed"
      color: danger
```

#### Security

To use the Appsemble secrets and to have the **Authorization** header attached to your requests, you
need to setup a [security schema](./security.md) and be logged in the app.

## PDF template

The next step is to upload a template, based on which a document will be created. The template file
can be any XML-document coming from LibreOffice™ or Microsoft Office™ (ods, docx, odt, xslx...)
([carbone docs](https://www.npmjs.com/package/carbone#how-it-works)).

The way templating works is described in the
[carbone documentation](https://carbone.io/documentation.html), which is the library used for
generating the PDFs.

In short, a template can contain plain text, as well as **markers** which look like `{d.title}`.
When a parameter called `title` is passed, the marker will be replaced with the value of that
parameter.

#### Example:

Template: `Hello, {d.someone}. My name is {d.myName}`

Parameters: `someone: Bob`, `myName: John`

Result: `Hello, Bob. My name is John`

### Uploading a template

After creating a template, it should be uploaded as an asset in the app. This can be done through
the **Assets** side menu. Details on how assets work in Appsemble can be found [here](./assets.md).

When uploading an asset it is recommended to give it a name, for covenience. This name will be
displayed as `Id`, and if left empty, will default to a randomly generated `Id`.

## Rendering the PDF

Finally, a request is ready to be sent to the PDF generator container.

The request should:

- Be a post request to the `/render` endpoint
- Contain a body with fields:
  - `template` - The `Id` of the template from the previous step as **string**.
  - `params` - An object, the keys of which are the same as the markers of the template, as shown in
    the [example](#example) section above.
- Have the `proxy` parameter set to `true`

A request action should looks something like:

```yaml
print:
  type: request
  url: { container: pdf-generator/render }
  proxy: true
  method: post
  body:
    object.from:
      template: your-template-name
      params:
        object.from:
          value: my-value
          anotherValue: '123'
  onSuccess:
    type: download
    filename: my-rendered.pdf
```

## Troubleshooting

After triggering the request action, the PDF should be downloaded in a few seconds. In case this
does not happen, there are a few things to try.

#### Live view

Open the app in the live view, instead of in the editor and try downloading again.

#### Debug using the network tab

1. Open the **network** tab of your browser. This can be done with `ctrl + shift + i` on Firefox and
   Chrome. On other browsers this might vary.
2. Trigger the print action.
3. A new request entry should appear in the tab. Check what status code is returned. Most probably
   it is one of the following:

- `400` - Parameters in the request are wrong. Template property must be a string and must not be
  missing. Params property must be an object (and not an array).
- `401` - Security is not setup properly and the request to the backend is not authenticated, or not
  setup at all.
- `403` - You are trying to send a request to a container hosted by your app. This can be avoided by
  using the [container remapper](../remappers/data.mdx#container) for the `url` property of your
  request.
- `500` - Internal error within the container. Probably the container has started, but it might be
  unable to fetch the template from Appsemble. Check if the name of the template is spelled
  properly, if the format of the provided file is [supported](#pdf-template), if the `appId` and
  `remote` in the container definition are set properly.
- `502` - Indicates that the url, to which the request is sent is invalid, or the container has not
  be created at all.

The container logs tab in the app side menu might also contain useful information as to what the
issue is.

#### Check the error message

This can be achieved by displaying the error of the request as a banner in the app:

```yaml
onError:
  type: message
  body: { prop: message }
  color: danger
```

Or by printing the error to the console of the browser:

```yaml
onError:
  type: log
```

This will provide additional clue to what might be wrong with the setup.
