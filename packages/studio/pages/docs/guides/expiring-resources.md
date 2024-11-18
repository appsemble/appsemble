# Expiring resources

There are some use cases where resources should be removed automatically after a set period of time.
This can be done by setting the `expires` property. This property contains a string describing how
long it takes for a resource to be considered expired.

For example:

```yaml validate resources-snippet
resources:
  expiring-resource:
    schema:
      type: object
      additionalProperties: false
      properties:
        name:
          type: string
    expires: 1d 12h # resource will expire in 36 hours
```

In the above example, a resource will be removed 36 hours after it was created, unless this was
otherwise specified.

The syntax used for `expires` supports the following units which can be combined:

```
seconds (s, sec)
minutes (m, min)
hours (h, hr)
days (d)
weeks (w, wk)
months
years (y, yr)

Examples:
1h20m - 1 hour and 20 minutes
2 hr 20 min - 2 hours and 20 minutes
1y 22w 40min - 1 year, 22 weeks, and 40 minutes
```

The exact time at which the resource will expire will be listed under the `$expires` property when
fetching or updating a resource. The exact date and time of when the resource will be expired can
also be manually set by including the `$expires` property with a valid ISO 8601 date/time value.

> Note: When adding `expires` to a resource, this will not be retroactively applied to existing
> resources. These resources can be updated to have an expiration date set by updating the resource
> and including the `$expires` property.
