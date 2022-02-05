export function findNextSiblingTagName(
  el: Element,
  tagName: string,
): Element | undefined {
  let child: Element | null = el;
  while (true) {
    child = child.nextElementSibling;
    if (child === null) return undefined;
    if (child.tagName === tagName) return child;
  }
}
