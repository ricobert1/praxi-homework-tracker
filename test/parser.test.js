// Runs the app's parsing/merging core (PraxiHW) inside jsdom, against synthetic fixtures.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
// jsdom arrays come from another realm; compare plain copies.
const plain = v => JSON.parse(JSON.stringify(v));
const same = (a, b) => assert.deepEqual(plain(a), b);
const fixture = name => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

function core() {
  const dom = new JSDOM(html, { runScripts: 'dangerously', beforeParse(w) { w.PRAXIHW_TEST = true; } });
  return dom.window.eval('PraxiHW');
}

test('finds each class list in a paste', () => {
  const P = core();
  const lists = P.parsePaste(fixture('paste-1.html'));
  same(lists.map(l => l.cls), ['MS English 7 - Mrs. Rivera', 'MS Pre-Algebra - Mr. Chen', 'MS History 7 - Ms. Patel']);
  assert.ok(lists.every(l => l.assignedISO === '2026-11-16'));
});

test('reads due dates from headings and inline "(due m/d)" lessons', () => {
  const P = core();
  const [eng, alg] = P.parsePaste(fixture('paste-1.html'));
  same(eng.items.map(i => [i.title, i.due]), [['Read chapter 4', '2026-11-18'], ['Study vocabulary for Unit 6', '2026-11-20']]);
  same(eng.items[0].details.map(d => d.text), ['Answer questions 1-5 in your journal']);
  same(alg.items.map(i => [i.title, i.due, i.details.map(d => d.text).join()]),
    [['Lesson 34', '2026-11-18', 'Problems 1-20 odd'], ['Lesson 35', '2026-11-19', 'Problems 2-24 even']]);
});

test('presentation sign-up: no name set → asks, never hides', () => {
  const P = core();
  const it = P.parsePaste(fixture('paste-1.html'))[2].items[0];
  assert.ok(!it.notMine);
  assert.equal(it.flags[0].type, 'confirm');
});

test('presentation sign-up: finds the student by full name', () => {
  const P = core();
  P.configure({ names: ['Alex Sample'] });
  const it = P.parsePaste(fixture('paste-1.html'))[2].items[0];
  assert.ok(!it.notMine);
  assert.equal(it.flags[0].text, 'Alex presents: Greece');
  assert.ok(it.presenters.find(p => p.presenter === 'Alex Sample').mine);
});

test('presentation sign-up: someone else → marked not mine', () => {
  const P = core();
  P.configure({ names: ['Pat Other', 'Patrick Other'] });
  const it = P.parsePaste(fixture('paste-1.html'))[2].items[0];
  assert.ok(it.notMine);
});

test('parent sign-off follows Settings', () => {
  const P = core();
  P.configure({ names: ['Alex Sample'], signClasses: ['MS Pre-Algebra - Mr. Chen'], signPresentations: false });
  const [eng, alg, hist] = P.parsePaste(fixture('paste-1.html'));
  assert.ok(P.needsSign(alg.items[0]));
  assert.ok(!P.needsSign(eng.items[0]));
  assert.ok(!P.needsSign(hist.items[0]));
  P.configure({ names: ['Alex Sample'], signClasses: [], signPresentations: true });
  const hist2 = P.parsePaste(fixture('paste-1.html'))[2];
  assert.ok(P.needsSign(hist2.items[0]));
});

test('newer list replaces the same class + due date; others carry over', () => {
  const P = core();
  const m = P.buildModel([{ html: fixture('paste-1.html') }, { html: fixture('paste-2.html') }]);
  const eng = due => m.items.filter(i => i.cls === 'MS English 7 - Mrs. Rivera' && i.due === due).map(i => i.title);
  same(eng('2026-11-20'), ['Vocabulary quiz Unit 6 on 11/20', 'Bring your independent reading book']);
  same(eng('2026-11-18'), ['Read chapter 4']);
  assert.ok(m.events.some(e => e.date === '2026-11-20' && /quiz/i.test(e.text)));
});

test('flags a heading whose weekday does not match its date', () => {
  const P = core();
  const m = P.buildModel([{ html: fixture('paste-2.html') }]);
  assert.ok(m.warnings.some(w => /Wednesday but 11\/24 is a tuesday/.test(w)));
});

test('status: a teacher edit after checking shows as changed', () => {
  const P = core();
  const it = P.parsePaste(fixture('paste-1.html'))[0].items[0];
  assert.equal(P.statusOf(it, { [it.id]: { done: true, sig: it.sig } }, '2026-11-17'), 'done');
  assert.equal(P.statusOf(it, { [it.id]: { done: true, sig: 'old' } }, '2026-11-17'), 'changed');
});

test('recognizes non-English teacher titles in class headers', () => {
  const P = core();
  const paste = `<div>Assigned: Nov 16, 2026</div>
<div>MS Spanish I - Sra. Morales</div><p>Due Tuesday 11/17</p><ul><li>Conjugation worksheet</li></ul>
<div>MS French I - Mme Dubois</div><p>Due Tuesday 11/17</p><ul><li>Dialogue practice</li></ul>
<div>MS PE - Coach Reyes</div><p>Due Tuesday 11/17</p><ul><li>Fitness log</li></ul>`;
  same(P.parsePaste(paste).map(l => [l.cls, l.items.map(i => i.title)]), [
    ['MS Spanish I - Sra. Morales', ['Conjugation worksheet']],
    ['MS French I - Mme Dubois', ['Dialogue practice']],
    ['MS PE - Coach Reyes', ['Fitness log']]]);
});
