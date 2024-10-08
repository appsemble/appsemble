# GUI Editor

![GUI Editor](assets/gui/gui-editor.png 'GUI Editor')

Editing a block can be done through the code editor you have seen so far. However a new addition to
Appsemble is the GUI Editor. This tool allows you to create apps without writing a single line of
code and it is accessible by one button click

![Switch Button](assets/gui/switch-button.png 'Switch Button')

## Table of Contents

- [GUI Editor Tabs](#gui-editor-tabs)
- [Pages Tab](#pages-tab)
- [General Tab](#general-tab)
- [Theme Tab](#theme-tab)
- [Style Tab](#style-tab)
- [Resources Tab](#resources-tab)
- [Security Tab](#security-tab)
- [Further Reading](#further-reading)

## GUI Editor Tabs

![GUI Editor Tabs](assets/gui/gui-tabs.png 'GUI Editor Tabs')

The GUI Editor provides the full functionality of the code editor. The editor is made up from two
collapsible sidebars on the left and right, tabs and buttons at the top and the app view in the
middle.

## Pages Tab

The functionality of the GUI Editor is split over 6 different tabs. The first tab is the pages tab,
this is where the pages of the app are created and edited.

![App Editor](assets/gui/app-editor.png 'App Editor')

The large area in the middle of the editor is the app view. In the pages tab this is an interactive
view of the app that allows for selecting blocks with the mouse and dragging and dropping them to
re-order.

The left sidebar holds the app pages and blocks hierarchy. You can select any page, sub-page and
block by clicking and drag and drop them. This way you can re-order the blocks for a page or drag a
block into another page.

The right sidebar is occupied by the `block store`. All available blocks are laid out in two columns
and can be dragged into the app view. Doing so will create that block in the currently selected page
at the end of the block list of that page. When you select a block or click the properties button at
the top of the right sidebar the `block store` is replaced by the property menu. Here you can change
the properties of the selected block or page.

After any edit is made the save button in the top bar glows blue. On hovering it shows the changes
made and on click it will save the changes to the app definition if possible. On success a green
popup is shown and on failure a red popup with an error message is shown. If a change needs to be
reverted the top bar houses undo and redo buttons that show what they change on hover. Alternatively
the hotkeys `ctrl+z` and `ctrl+y` can be used.

## General Tab

The general tab allows you to change general app settings like the app name and description.

In the app view you see the app preview that allows you to test the app functionality while you
change settings. It auto updates for every made change.

![App Preview](assets/gui/app-preview.png 'App Preview')

In the left sidebar you can switch between general, layout and schedule settings. In the right
sidebar the properties can be changed.

## Theme Tab

The theme tab allows you to change theming settings for the app. In the left sidebar there is a
hierarchy of the app pages and blocks where you can select what part of the app your theming will
affect.

![Theme Colors](assets/gui/theme-colors.png 'Theme Colors') In the right sidebar you can set colors
for your app. The colors follow the hierarchy so a color set for a block will overwrite the color
set for its page. You can reset any color choice to its default by clicking the black x next to the
color picker.

Below the colors there are tile layers and font options.

## Style Tab

The style tab allows the user to change the app’s styling `CSS` without knowing how to write it. It
features a simple menu in the right sidebar for adding borders, margin and padding to any block or
menu item selected in the left sidebar hierarchy.

![Style Properties](assets/gui/style-props.png 'Style Properties')

The generated `CSS` code can be viewed in the text box at the bottom of the right sidebar.

## Resources Tab

The resources tab houses an editor for resources. However it is not yet implemented.

## Security Tab

The security tab allows the user to set roles and groups by adding them in the right sidebar menu.
The created roles show up in the left sidebar.

## Further Reading

The GUI Editor can be swapped for the code editor on the fly by clicking the `Switch to Code Editor`
button. Note however that unsaved changes will be lost.

If you find any bugs while using the GUI Editor please click the **bug report** button and add your
bug to the comments if it is not already there.
