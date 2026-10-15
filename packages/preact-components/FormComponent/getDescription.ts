/**
 * Get the accessible description of an element from the elements its `aria-describedby` refers to.
 *
 * @param element The element to get the description of.
 * @returns The text content of the describing elements, joined by a space.
 */
export function getDescription(element: HTMLElement): string {
  return (element.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent)
    .join(' ');
}
