// Reconcile live panels instead of replacing controls on every clock refresh.
// Button identity must survive from pointer-down through click, including when
// sibling counters change. Parsing happens only in a detached template.
const rendered = new WeakMap();
const identityAttributes = [
  'data-action',
  'data-id',
  'data-type',
  'data-key',
  'data-slot',
  'data-speed',
  'data-change',
];
function key(node) {
  if (node.nodeType !== 1) return '';
  if (node.id) return `id:${node.id}`;
  if (node.hasAttribute('data-ui-key')) return `key:${node.getAttribute('data-ui-key')}`;
  if (node.hasAttribute('data-action'))
    return identityAttributes.map((name) => node.getAttribute(name) || '').join('|');
  if (node.tagName === 'OPTION') return `option:${node.value}`;
  return '';
}
function compatible(a, b) {
  return a && a.nodeType === b.nodeType && a.nodeName === b.nodeName && key(a) === key(b);
}
function patch(current, next) {
  if (current.nodeType === 3 || current.nodeType === 8) {
    if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
    return;
  }
  for (const attr of [...current.attributes])
    if (!next.hasAttribute(attr.name)) current.removeAttribute(attr.name);
  for (const attr of next.attributes)
    if (current.getAttribute(attr.name) !== attr.value) current.setAttribute(attr.name, attr.value);
  reconcile(current, next);
}
function reconcile(parent, desired) {
  const available = new Set(parent.childNodes);
  let position = parent.firstChild;
  for (const next of [...desired.childNodes]) {
    const current = compatible(position, next)
      ? position
      : key(next)
        ? [...available].find((node) => compatible(node, next))
        : null;
    if (current) {
      available.delete(current);
      if (current !== position) parent.insertBefore(current, position);
      patch(current, next);
      position = current.nextSibling;
    } else {
      parent.insertBefore(next.cloneNode(true), position);
    }
  }
  for (const node of available) node.remove();
}
export function updateHTML(element, html) {
  if (rendered.get(element) === html) return;
  const template = element.ownerDocument.createElement('template');
  template.innerHTML = html;
  reconcile(element, template.content);
  rendered.set(element, html);
}
