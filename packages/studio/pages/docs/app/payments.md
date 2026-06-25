# Payments

Payments can be integrated into your applications using the Stripe payment processor, allowing you
to sell products and receive funds directly into your bank account.

## Table of Contents

- [Introduction](#introduction)
- [Stripe configuration](#stripe-configuration)
- [App definition](#app-definition)
- [App settings](#app-settings)

## Introduction

To enable payments in your Appsemble applications, you’ll need to create and configure a Stripe
account, and provide the required credentials in your app’s settings.

Payment integration is configured at the app level, meaning each app can use its own Stripe account.
Alternatively, by reusing the same Stripe `API key`, you can connect multiple apps to a single
Stripe account.

Webhooks are always first delivered to the main Appsemble server, where they are verified with
`Stripe secret` before being forwarded to the relevant app.

Stripe checkouts for apps are created by sending api requests to the Appsemble server at
`https://appsemble.app/api/apps/{appId}/createCheckout?price={priceId}`. Request body also takes a
`redirectParams` object that will be appended to the end of `success` and `cancel` urls.

## Stripe configuration

For development, you should use a
[Sandbox environment or a Stripe account in test mode](https://docs.stripe.com/sandboxes), which
allow you to test the full payment flow without real charges. Once your app functions as expected
and is ready for launch, switch to Live mode to accept real payments.

1.  Create a [Stripe account](https://stripe.com) and complete the required setup steps to activate
    it. This includes providing basic business and payment information so the account can process
    transactions properly.
2.  Navigate to the `Product catalog` and create the product you wish to sell. Here you can choose
    between a one time payment or a recurring payment in which you can configure Stripe to collect
    payment from a customer on a defined billing interval (for example monthly subscription).
3.  Create a [webhook endpoint](https://docs.stripe.com/webhooks) by navigating to `Developers` ->
    `Webhooks` and selecting `Add destination`. Stripe will deliver selected events to the provided
    end enabling you to know when user payment has been accepted. Firstly you need to select events
    that you wish to receive for use in your app, we recommend using `checkout.session.completed`
    however, it is possible to use a wide range of different events based on the payment methods you
    enable. Next, configure destination type as `Webhook endpoint` and finally provide the url which
    should be `https://appsemble.app/api/apps/{appId}/accept-payment`, replacing `{appId}` with the
    id of your application.

## App definition

First step is creating a `Stripe checkout` for your app which can be done by sending api request to
`https://appsemble.app/api/apps/{appId}/createCheckout?price={priceId}`. The endpoint will respond
with the url of Stripe checkout to which you can redirect the user. Important detail to note is that
the parameter is `price id` and not the `product id` because Stripe allows multiple prices for a
product.

Below is an example code for a page that has a product image and a purchase button which first
creates a Stripe checkout, then creates a pending invoice in the database before redirecting the
user to the Stripe checkout page to complete the payment. The example code uses a variable for
storing the `price id` of the product which enables easier management once the app is live since it
won't require re-publishing to change a price.

```
pages:
  - name: CheckoutUrl
    blocks:
      - type: image
        version: 0.33.7
        parameters:
          url: banana
          alt: Image of a banana
          rounded: false
          alignment: center
      - type: button-list
        version: 0.33.7
        parameters:
          buttons:
            - label: Purchase
              color: primary
        actions:
          onClick:
            type: request
            url:
              string.format:
                template: 'http://localhost:9999/api/apps/{appId}/createCheckout?price={priceId}'
                values:
                  appId: { app: id }
                  priceId: { variable: price }
            method: post
            proxy: false
            onSuccess:
              type: noop
              onSuccess:
                type: resource.create
                resource: invoice
                remapBefore:
                  object.from:
                    item: banana
                    stripeCheckoutId: [ { history: 1 }, { prop: checkoutId } ]
                    status: pending
                onSuccess:
                  remapBefore:
                    object.from:
                      url: [ { history: 1 }, { prop: url } ]
                  type: link
                  to: { prop: url }
```

Second step is ensuring your app includes a definition for `accept-payment` webhook. This webhooks
defines what your app does once it receives a webhook from Stripe.

Below is an example from the demo payments app, the name should remain exactly `accept-payment` but
the logic inside can be customized according to your wishes and needs.

In this example, the app checks if received event is `checkout.session.completed`. If so, it queries
the database for the corresponding invoice which is then updated to paid. In a real-world app, this
is where you might also activate a subscription or trigger the shipping process for a purchased
item.

```
webhooks:
  accept-payment:
    schema:
      type: object
      additionalProperties: true
    action:
      type: condition
      if: { equals: [ { prop: type }, 'checkout.session.completed' ] }
      then:
        type: resource.query
        resource: invoice
        query:
          object.from:
            $filter:
              string.format:
                template: stripeCheckoutId eq ''{stripeCheckoutId}''
                values:
                  stripeCheckoutId: [{ history: 0 }, { prop: data }, { prop: object }, { prop: id } ]
        onSuccess:
          remapBefore:
            object.from:
              id: [{prop: 0 }, { prop: id }]
              status: paid
          type: resource.patch
          resource: invoice
          onSuccess:
            type: event
            event: refreshInvoices
      else:
        type: noop
```

## App settings

1. Navigate to `App` -> `Secrets` -> `Payment settings` and tick the checkbox which will enable
   payment-related configuration fields.
2. Provide `Stripe API key` which can be found in Stripe under `Developers` -> `API keys` ->
   `Secret key`.
3. Provide `Stripe secret` which can be found in Stripe under `Developers` -> `Webhooks` ->
   `Selecting endpoint created in step 3 of stripe configuration` -> `Signing secret`.
4. Provide `Success Url` which should be a URL within your app the users will be redirected to after
   successfully completing a payment on Stripe website. On this page we suggest querying the
   database and showing a purchase confirmation to the user.
5. Provide `Cancel Url` which should be a URL withing your app the users will be redirected to after
   failing to complete the payment on the Stripe website.
6. Scroll down to `Webhook` section and click `Add new secret`, selecting `accept-payment` from the
   dropdown, optional `name` and `Save webhook secret`.
7. We recommend managing `priceIds` through variables for easier updates. This is done by navigating
   to `Variables` page and clicking `Add new variable` with the name you defined in the app
   definition.

After completing this configuration, your app will be ready to accept payments. We which recommend
testing your integration using [Stripe test mode or a sandbox](https://docs.stripe.com/sandboxes).
