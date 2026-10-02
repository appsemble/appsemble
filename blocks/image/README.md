A block that can be used to display an image.

Set `fill: true` to make the image span the full width of the block. The image then has no fixed
pixel size, so the app theme can control its shape, for example:

```css
img {
  aspect-ratio: 3 / 2;
  object-position: 50% 10%;
}
```
