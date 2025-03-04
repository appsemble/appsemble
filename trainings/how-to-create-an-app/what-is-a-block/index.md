# What is a block

Blocks are what define most of the functionality of your apps. As mentioned in the previous
training, a page contains a list of blocks. Each block has its own functionality like loading data,
displaying data in a certain format or transforming data.

To get a good understanding of how blocks work and how to define one, take a look at the
documentation:

- [Block documentation](/docs/app/blocks)

With this knowledge we can pick a simple block from the [block store](/blocks) and fill in the
fields to add functionality to our app.

The following block takes the address of an image and displays it in the page:

```yaml copy validate-block
# The type of block to use
type: image
# The version of the block
version: 0.30.8
# Custom parameters of the block
parameters:
  # The URL of the image to host
  url: https://i.pinimg.com/736x/15/1a/48/151a485ede6c553a7ab9bdc0c0b04cbd.jpg
```

The image you put in the URL is then displayed in the page:

![Image block showcase in page](assets/image-block-showcase.png 'Image block showcase in page')

The block store contains all the blocks that people have uploaded to Appsemble. We provided a bunch
of essential blocks that cover basic functionality as well. These can be found by searching for
blocks that are from the `@appsemble` organization.

**(Optional)** If you can't quite create the app you want with the blocks that are available to you,
you can also create your own:

- [Developing blocks](/docs/development/developing-blocks)
