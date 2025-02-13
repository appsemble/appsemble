# Simple app

With the knowledge of how an app is structured, what pages are and how to populate them, you should
be ready to create a very simple app.

To conclude this chapter, we'll make a simple portfolio website for a game studio. If you're
confident you can do this by yourself, feel free to skip to the end to see how you did!

## 1. Creating the app

First, we'll create the app in the studio to get a blank template to work off of.

> **Note:** Make sure you are logged in and are in an organization with permissions that allow you
> to create apps (Maintainer or Owner). If you're stuck on this, read
> [Account setup](/docs/studio/account-setup.md)

Once you're set up, go to the [App store](/apps) and click on **Create new app**. You will be
prompted with a screen that asks you to fill in some details like the app's name and organization.
Pick a name that represents the app and set the organization to the one you want associated with the
app.

You can base your app off of an existing app by choosing a template. Since we'll be making something
brand new, you can pick the **Empty** template.

Once you're done, click **Create**.

Your app should now be created and you should be sent to its homepage.

## 2. Preparing the app definition

The app page gives you access to all the different systems that make up your app. For the purpose of
this tutorial we'll ignore all of these and only edit the app definition.

Click on the **Editor** tab on the left of the page, in the side menu.

You should now be greeted with the "App definition" that defines how your app works. Since we won't
be using any of the features in this definition, you can go ahead and delete everything except for
the `name`, `description`, and `defaultPage`. This will show some errors in the console, but we'll
get rid of them soon.

Your app editor should look like this:

![The app editor with a simple app definition](assets/app-editor-empty.png 'The app editor with a simple app definition')

## 3. Defining the homepage

For this app we want a homepage that describes the game studio and a page that shows the game they
made.

The `pages` property accepts an array of pages. To define an array in YAML, we can add a new line
and add a dash (-) to create a new entry in the array.

Let's start by creating the page definition for the homepage:

```yaml
name: Game studio portfolio
description: ''
defaultPage: Homepage

pages:
  - name: Homepage
    blocks:
```

The homepage of the studio should describe who they are and what they do. An easy way to do this is
by using a [markdown block](blocks/@appsemble/markdown).

The markdown block has a parameter called `content` that allows you to display markdown in your app.
This is a convenient way to show information about the game studio.

Let's add some content to let people know what the studio is all about:

```yaml
name: Game studio portfolio
description: ''
defaultPage: Homepage

pages:
  - name: Homepage
    blocks:
      - type: markdown
        version: 0.30.14-test.5
        parameters:
          # Note: The '\' characters create a new line.
          content: |
            # About us

            We're a team of passionate game developers that create\
            interactive virtual reality games. Our diverse team specialises\
            in creating unique experiences that are sure to leave an impact\
            for years to come!
```

Once this is filled in, there should be no more errors. You can see the result of this app
definition by pressing the **Preview** button, or by clicking on **Publish** and then **View live**.

The app should now look like this:

![Preview of the app with a simple "About us" section for the studio](assets/homepage-simple-description.png 'Preview of the app with a simple "About us" section for the studio')

## 4. Adding a page for the game

With a simple homepage ready, we can create a page to show off one of the games the studio made.

Under the pages object, add a new page with the title of the game as the name:

```yaml
...
pages:
  - name: Homepage
    ...
  - name: Echo's Journey VR
    blocks:
```

> **Tip:** You can collapse an object in the editor by clicking the arrow on the left of the line.
> This makes it much easier to navigate your app definition.

For this page we'll use a similar loadout as the homepage, but we will include an image of the game
as well.

Instead of using a web URL as the source of the image, we'll upload the image as an asset and
reference that in the image block.

To add a new asset, click on **Assets** in the side menu. Be sure to save your changes beforehand so
your progress does not go to waste.

Once you are on the Assets page you can add a new asset by pressing the **Upload new asset** button.
This will show a screen where you can add an asset and define a name for it. Once you've uploaded
the image you'd like to use to showcase the game and named it, click **Upload** and navigate back to
the editor.

Now that your app has an image as asset you can reference it in the image block under `url` by
typing the name of the asset:

```yaml
type: image
version: 0.30.14-test.5
parameters:
  url: echoes-journey-showcase
```

The final page definition should look like this:

```yaml
name: Echo's Journey VR
blocks:
  - type: markdown
    version: 0.30.14-test.5
    parameters:
      content: |
        # Echo's Journey VR

        Echo's journey is a virtual reality experience about escaping from an alien cave system.\
        Our new VR technology provide an immersive experience like never seen before!

        Wishlist our game now on Steam!
  - type: image
    version: 0.30.14-test.5
    parameters:
      url: echoes-journey-showcase
```

And the page like this:

![Showcase page for the game "Echo's Journey"](assets/echoes-journey-game-page.png 'Showcase page for the game "Echos Journey"')

## 5. Linking to the new page

Now that we have a new page we want to link to it from the homepage. The user can already see the
different pages in the `navbar` on the left, but we can also link to it from within the page itself.

You can link to a page in your app either by using the [link action](/docs/actions/link) or creating
a markdown link. We'll use the latter in this case.

The URL of a page is based off of the name. In the case of Echo's Journey, it gets transformed into
`echo-s-journey-vr`. This can be found by navigating to the page and checking the end of the URL.

Using this, we can create a 'table of contents' section on the homepage:

```yaml
type: markdown
version: 0.30.14-test.5
parameters:
  content: |
    ...
    ### Our work

    - [Echo's Journey](/echo-s-journey-vr)
```

The user can then click on the link to navigate to the page.

## Conclusion

You should now know the very basics of how an Appsemble app works like how they are structured, how
pages work and how blocks work. In the next chapter we will look at how data flow works and how to
make your apps interactive.

The final code can be seen here:

```yaml
name: Game studio portfolio
description: ''
defaultPage: Homepage
pages:
  - name: Homepage
    blocks:
      - type: markdown
        version: 0.30.14-test.5
        parameters:
          content: |
            # About us

            We're a team of passionate game developers that create\
            interactive virtual reality games. Our diverse team specialises\
            in creating unique experiences that are sure to leave an impact\
            for years to come!

            ### Our work

            - [Echo's Journey](/echo-s-journey-vr)
  - name: Echo's Journey VR
    blocks:
      - type: markdown
        version: 0.30.14-test.5
        parameters:
          content: |
            # Echo's Journey VR

            Echo's journey is a virtual reality experience about escaping from an alien cave system.\
            Our new VR technology provide an immersive experience like never seen before!

            Wishlist our game now on Steam!
      - type: image
        version: 0.30.14-test.5
        parameters:
          url: echoes-journey-showcase
```
