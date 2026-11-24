// Print list (compact and detailed) built inside jsdom from a synthetic 8-class paste.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const paste = fs.readFileSync(path.join(__dirname, 'fixtures', 'paste-8-detailed.html'), 'utf8');

function app(settings = { names: ['Alex Sample'], signClasses: ['MS Pre-Algebra - Mr. Chen'] }) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://example.test/', beforeParse(w) { w.PRAXIHW_TEST = true; } });
  const w = dom.window;
  w.eval(`PraxiHW.setNow(() => new Date('2026-11-24T08:00:00'));
    state = { pastes: [{ html: ${JSON.stringify(paste)} }], status: {}, settings: ${JSON.stringify(settings)} };
    PraxiHW.configure(state.settings); rebuild();`);
  return w;
}
const P = w => w.document.getElementById('print');
const text = w => P(w).textContent;

test('compact: one grid with all 8 classes, no bullets', () => {
  const w = app(); w.eval('printList()');
  assert.equal(P(w).querySelectorAll('.pl-grid').length, 1);
  assert.equal(P(w).querySelectorAll('.pl-hdr').length, 9);          // corner + 8 classes
  assert.equal(P(w).querySelectorAll('.pl-det').length, 0);
  assert.match(text(w), /Writing: Finish the rough draft/);          // compact borrows the first bullet
});

test('detailed: 8 classes split into two pages of 4, details and links shown', () => {
  const w = app(); w.eval('printList({ detail: true })');
  const grids = P(w).querySelectorAll('.pl-grid');
  assert.equal(grids.length, 2);
  assert.deepEqual([...grids].map(g => g.querySelectorAll('.pl-hdr').length), [5, 5]);
  assert.match(text(w), /part 1 of 2: English 7, Pre-Algebra, History 7, Life Science/);
  assert.match(text(w), /Bring a printed copy of your draft to class for peer review/);
  assert.match(text(w), /🔗 Essay rubric — docs\.google\.com\/…/);
  assert.match(text(w), /★ Alex presents: Greece: The Olympics/);    // full topic, own row only
  assert.doesNotMatch(text(w), /Jamie Doe|Pat Other/);
  assert.doesNotMatch(text(w), /Writing: Finish the rough draft/);   // title stays "Writing:", bullets follow
});

test('detailed: 5 or fewer classes stay on one grid', () => {
  const w = app();
  assert.equal(w.eval('classPages(["a","b","c","d","e"], true)').length, 1);
  assert.deepEqual(JSON.parse(w.eval('JSON.stringify(classPages(["a","b","c","d","e","f","g"], true).map(p => p.length))')), [4, 3]);
  assert.deepEqual(JSON.parse(w.eval('JSON.stringify(classPages(["a","b","c","d","e","f"], true).map(p => p.length))')), [3, 3]);
});

test('next school day: only overdue + the next day', () => {
  const w = app(); w.eval('printList({ detail: true, range: "next" })');
  const labels = [...P(w).querySelectorAll('.pl-grid')[0].querySelectorAll('.pl-lbl')].map(l => l.firstChild.textContent);
  assert.deepEqual(labels, ['Overdue', '▶ Wed 11/25']);
  assert.match(text(w), /Alex’s Homework — Wed 11\/25/);
});
