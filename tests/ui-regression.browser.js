import { updateHTML } from '../src/ui-dom.js';
const fixture = document.querySelector('#fixture');
let passed = 0,
  failed = 0;
function assert(condition, message) {
  if (!condition) throw Error(message);
}
async function test(name, fn) {
  const host = document.createElement('section');
  fixture.replaceChildren(host);
  const row = document.createElement('li');
  try {
    await fn(host);
    passed++;
    row.className = 'pass';
    row.textContent = `PASS — ${name}`;
  } catch (error) {
    failed++;
    row.className = 'fail';
    row.textContent = `FAIL — ${name}: ${error.message}`;
  }
  document.querySelector('#results').append(row);
}
await test('Unchanged refreshes make no DOM mutations', async (host) => {
  const html = '<button data-action="wait">Wait</button>';
  updateHTML(host, html);
  const records = [],
    observer = new MutationObserver((entries) => records.push(...entries));
  observer.observe(host, { subtree: true, childList: true, attributes: true, characterData: true });
  for (let n = 0; n < 20; n++) updateHTML(host, html);
  await Promise.resolve();
  observer.disconnect();
  assert(records.length === 0, 'Idle refresh mutated the DOM');
});
await test('A press spanning refreshes keeps its target and activates exactly once', async (host) => {
  const html = (n) => `<span>${n}</span><button data-action="wait">Wait</button>`;
  updateHTML(host, html(0));
  const button = host.querySelector('button');
  let clicks = 0;
  host.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="wait"]')) clicks++;
  });
  button.focus();
  button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  for (let n = 1; n <= 5; n++) {
    updateHTML(host, html(n));
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  assert(
    button === host.querySelector('button') && button.isConnected,
    'Pressed button was replaced',
  );
  assert(document.activeElement === button, 'Keyboard focus lost');
  button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  button.click();
  assert(clicks === 1, 'Click lost or duplicated');
  assert(host.querySelector('span').textContent === '5', 'Clock did not update');
});
await test('Counters, active styles and disabled states change without replacing controls', (host) => {
  updateHTML(
    host,
    '<button data-action="stance" data-id="hold" disabled><small>5</small></button>',
  );
  const button = host.firstChild,
    label = button.firstChild;
  updateHTML(
    host,
    '<button data-action="stance" data-id="hold" class="active"><small>4</small></button>',
  );
  assert(host.firstChild === button && button.firstChild === label, 'Control or child replaced');
  assert(
    !button.disabled && button.classList.contains('active') && label.textContent === '4',
    'State stale',
  );
});
await test('Hero attachment retains focus and selection while counters refresh', (host) => {
  const html = (n, value) =>
    `<span>${n}</span><select id="attachment">${['hero', 'infantry'].map((id) => `<option value="${id}" ${value === id ? 'selected' : ''}>${id}</option>`).join('')}</select>`;
  updateHTML(host, html(0, 'hero'));
  const select = host.querySelector('select');
  select.focus();
  select.value = 'infantry';
  updateHTML(host, html(1, 'infantry'));
  updateHTML(host, html(2, 'infantry'));
  assert(select === host.querySelector('select') && select.value === 'infantry', 'Selection reset');
  assert(document.activeElement === select, 'Select focus lost');
});
await test('Roster keys retain the correct person when another card disappears', (host) => {
  const card = (id) =>
    `<article data-ui-key="${id}"><button data-action="character" data-id="${id}">${id}</button></article>`;
  updateHTML(host, card('a') + card('b'));
  const personB = host.lastChild,
    buttonB = personB.firstChild;
  updateHTML(host, card('b'));
  assert(host.firstChild === personB && personB.firstChild === buttonB, 'Wrong person reused');
  assert(host.children.length === 1, 'Removed person still shown');
});
await test('Changed actions replace obsolete buttons instead of misdirecting clicks', (host) => {
  updateHTML(host, '<button data-action="begin-battle">Begin</button>');
  const old = host.firstChild;
  updateHTML(host, '<button data-action="pause-battle">Pause</button>');
  assert(
    !old.isConnected && host.firstChild.dataset.action === 'pause-battle',
    'Old action reused',
  );
});
await test('Typed text survives unrelated updates', (host) => {
  updateHTML(host, '<input id="name" value="Nicholas"><span>0</span>');
  const input = host.firstChild;
  input.value = 'Edited name';
  input.focus();
  updateHTML(host, '<input id="name" value="Nicholas"><span>1</span>');
  assert(input === host.firstChild && input.value === 'Edited name', 'Input reset');
});
await test('Panel scrolling survives changing live data', (host) => {
  const html = (n) =>
    `<div id="scroll-area" style="height:50px;overflow:auto"><div style="height:300px">${n}</div><button data-action="wait">Wait</button></div>`;
  updateHTML(host, html(0));
  const panel = host.firstChild;
  panel.scrollTop = 100;
  updateHTML(host, html(1));
  assert(host.firstChild === panel && panel.scrollTop === 100, 'Scroll reset');
});
document.querySelector('#summary').textContent = `${passed} passed · ${failed} failed`;
document.querySelector('#summary').className = failed ? 'fail' : 'pass';
