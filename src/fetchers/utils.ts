export function findNextSiblingMatches(
  el: Element,
  selector: string,
): Element | undefined {
  let child: Element | null = el;
  while (true) {
    child = child.nextElementSibling;
    if (child === null) return undefined;
    if (child.matches(selector)) return child;
  }
}
