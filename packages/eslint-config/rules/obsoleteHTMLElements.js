/**
 * A list of obsolete and deprecated HTML elements
 *
 * Taken from https://developer.mozilla.org/en-US/docs/Web/HTML/Element#Obsolete_and_deprecated_elements
 */
const elements = [
  'acronym',
  'applet',
  'basefont',
  'bgsound',
  'big',
  'blink',
  'center',
  'command',
  'content',
  'dir',
  'element',
  'font',
  'frame',
  'frameset',
  'image',
  'isindex',
  'keygen',
  'listing',
  'marquee',
  'menuitem',
  'multicol',
  'nextid',
  'nobr',
  'noembed',
  'noframes',
  'plaintext',
  'shadow',
  'spacer',
  'strike',
  'tt',
  'xmp'
]

export default elements.map((element) => ({
  element,
  message:
    'https://developer.mozilla.org/en-US/docs/Web/HTML/Element#Obsolete_and_deprecated_elements'
}))
