# App analytics

By default no analytics are applied to Appsemble apps.

## Google Analytics

> **Note** Apps do **not** show a cookie banner.

Appsemble has support for Google Analytics. In order to integrate Google Analytics, follow the
instructions on [Get started with Analytics](https://support.google.com/analytics/answer/1008015).
The Stream URL should refer to the URL of your app. Use the custom domain name if your app has one,
otherwise use the full URL of the app, for example: `https://my-app.my-organization.appsemble.app`.

Step 4 refers to
[Set up the Analytics global site tag](https://support.google.com/analytics/answer/1008080). Follow
these instructions as well, but instead of injecting the global site tag, copy the _Measurement ID_
(sometimes called _Tracking ID_ or _Analytics ID_) into the _Google Analytics ID_ field in the app
settings of your Appsemble app.

## Custom analytics actions

It’s possible to send custom analytics actions.

```yaml
type: analytics
target: my_custom_target
```

This action does not disrupt the user flow. Typically this is used with an action’s `onSuccess`
property. For example this could be used to track when a user shares something.

```yaml
type: share
url: { app: url }
title: Test results
text: Check out my great results!
onSuccess:
  type: analytics
  target: score
  config:
    object.from:
      score: { prop: score }
```

## Recommended settings for Google Analytics

Pursuant to Article 14 of the GDPR, as a controller, you must have an employment contract in place
to connect to Google. This states that Google only works with the processing of the personal data of
your website visitors. You can cancel this agreement through the Google Analytics settings menu:

1. Go to the Admin page
2. Click on “Account Settings”
3. Click on “Review Amendment”
4. After you review the amendment, click “Done”
5. Click “Done” again to save your account settings

In order to comply with European privacy laws, the following settings must be applied to your
analytics account:

1. Go to the Admin page
2. Click on “Account Settings”
3. Disable all 5 of the Data Sharing Settings:
   - [ ] Google products & services
   - [ ] Benchmarking
   - [ ] Technical support
   - [ ] Account specialists: Google marketing
   - [ ] Account specialists: Google sales experts
4. Click on “Save”.
