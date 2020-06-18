A block used for inputting and submitting sets of data.

### Images

![Form screenshot](https://gitlab.com/appsemble/appsemble/-/raw/0.13.3/docs/images/form.png)

### String fields

Fields with the type of [`string`](#StringField) support requirements. This is an array of
requirements that are used to validate the value the user inputs. Each requirement can be provided
with its own custom error message, allowing for better feedback towards users.

For example, the [`regex`](#RegexRequirement) requirement type allows you to validate a field using
[`regex`](https://learnxinyminutes.com/docs/pcre/). So for example if you want a string field that
requires a field to be an email address that ends with “@appsemble.com”, you could enforce this like
so:

```yaml
requirements:
  - regex: \w+@appsemble\.com
    errorMessage: Value does not end with “@appsemble.com”
```

### Notes

> Loading initial form data does not work with inputs of type `geocoordinates`.
