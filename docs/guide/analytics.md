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
