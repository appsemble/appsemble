# App Icons

Appsemble apps support two types of icons: regular icons and maskable icons.

Regular icons may be used for various purposes. Some example usages are:

- Browser icon
- App icon on Windows
- App icon on Mac OS
- App icon on Linux
- Icon in the login screen of the app

For app icons it’s generally recommended to use a transparent icon that looks good on any dark or
light background.

In addition to regular icons, Appsemble also supports maskable icons, sometimes referred to as
adaptive icons.

Some example usages are:

- App icon on Android
- App icon on iPhone
- App icon on iPad
- App icon in Appsemble Studio

Maskable icons may be rendered using some platform specific contexts and shapes. The important part
of the icons should be within a 80% diameter circle within the full image, also known as the safe
area. The rest should be filled with the background, which may be stripped when the icon is
displayed.

![Maskable icon template](../../config/assets/maskable-icon-template.svg 'Maskable icon template')

If no maskable icon is specified, Appsemble will scale the regular icon so it fits within this safe
area. The transparent background is filled with a background color that can be selected.
