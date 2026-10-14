// Проверки лендинга. Запуск: node tests/site.test.mjs   (STRICT=1 — падать на незаполненных [..])
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = (f) => pathToFileURL(path.join(root, f)).href;

const SECTIONS = ['hero', 'audience', 'cases', 'program', 'format', 'pricing', 'author', 'faq', 'final', 'footer'];
const LINK_KEYS = ['freeLessonBot', 'courseBot', 'lessonBot', 'offer', 'privacy', 'consentData', 'consentMailing'];
const SUPPORT = 'Уроки доступны сразу. Отвечаю на вопросы в чате с 4 ноября';
const LEGAL = ['oferta.html', 'privacy.html', 'consent-data.html', 'consent-mailing.html'];

let failed = 0;
const ok = (name) => console.log('  ok   ' + name);
const bad = (name, why) => { failed++; console.log('  FAIL ' + name + ' :: ' + why); };
async function check(name, fn) {
  try { const r = await fn(); if (r === true || r === undefined) ok(name); else bad(name, String(r)); }
  catch (e) { bad(name, e.message.split('\n')[0]); }
}

const isFont = (u) => /fonts\.(googleapis|gstatic)\.com/.test(u);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function open(file, width, { blockLinks = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() !== 'error' || isFont(m.text())) return; if (blockLinks && /Failed to load resource/.test(m.text())) return; errors.push('console: ' + m.text()); });
  page.on('requestfailed', (r) => { if (!isFont(r.url()) && !(blockLinks && r.url().endsWith('links.js'))) errors.push('request: ' + r.url()); });
  if (blockLinks) await page.route('**/links.js', (r) => r.abort());
  await page.goto(url(file), { waitUntil: 'load' });
  return { page, ctx, errors };
}

const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

console.log('index.html');
if (!existsSync(path.join(root, 'index.html'))) {
  bad('index.html существует', 'файла нет');
} else {
  for (const w of [320, 375, 1280]) {
    const { page, ctx } = await open('index.html', w);
    await check(`без горизонтальной прокрутки на ${w}px`, async () => (await noOverflow(page)) || 'есть прокрутка');
    await ctx.close();
  }

  const { page, ctx, errors } = await open('index.html', 375);
  const text = await page.evaluate(() => document.body.innerText);

  await check('секции на месте', async () => {
    const missing = [];
    for (const id of SECTIONS) if (!(await page.$('#' + id))) missing.push(id);
    return missing.length ? 'нет: ' + missing.join(', ') : true;
  });
  await check('ключи LINKS', async () => {
    const keys = await page.evaluate(() => Object.keys(window.LINKS || {}));
    return LINK_KEYS.every((k) => keys.includes(k)) || 'есть: ' + keys.join(',');
  });
  await check('у каждого [data-link] есть ключ', async () => {
    const bad_ = await page.evaluate(() => [...document.querySelectorAll('[data-link]')]
      .map((a) => a.getAttribute('data-link')).filter((k) => !(k in (window.LINKS || {}))));
    return bad_.length ? 'нет ключей: ' + bad_.join(',') : true;
  });
  await check('нет цены 4990', async () => !text.includes('4990') || 'найдено 4990');
  await check('есть цена 7990 ₽ и 990 ₽', async () => (text.includes('7990 ₽') && /(^|\D)990 ₽/.test(text)) || 'цены не найдены');
  await check('строка о поддержке дословно', async () => text.includes(SUPPORT) || 'строка не найдена');
  await check('реквизиты автора', async () => (text.includes('Лугинова Евгения Романовна') && text.includes('ИНН 142701444302')) || 'реквизиты не найдены');
  await check('в программе 9 уроков', async () => (await page.$$eval('#program ol li', (n) => n.length)) === 9 || 'не 9');
  await check('в FAQ не менее 7 вопросов', async () => (await page.$$eval('#faq details', (n) => n.length)) >= 7 || 'меньше 7');
  await check('кнопки не ниже 44px', async () => {
    const small = await page.$$eval('a.btn', (n) => n.filter((a) => a.getBoundingClientRect().height < 44).map((a) => a.textContent.trim()));
    return small.length ? 'низкие: ' + small.join(' | ') : true;
  });
  await check('нет ошибок консоли и сети', async () => errors.length === 0 || errors.join('; '));
  await check('у summary в FAQ виден фокус', async () => {
    const css = await page.evaluate(() => {
      const s = document.querySelector('#faq summary'); if (!s) return null;
      s.focus(); const c = getComputedStyle(s);
      return c.outlineStyle !== 'none' || c.boxShadow !== 'none';
    });
    return css === true || 'нет видимого фокуса';
  });

  const holes = [...new Set(text.match(/\[[^\]]{2,}\]/g) || [])];
  if (holes.length) {
    console.log('  warn незаполнено (' + holes.length + '): ' + holes.join(' ; '));
    if (process.env.STRICT === '1') bad('STRICT: заглушки [..]', holes.length + ' шт.');
  }
  await ctx.close();

  const blocked = await open('index.html', 375, { blockLinks: true });
  await check('без links.js: кнопки видны, ошибок нет', async () => {
    const hidden = await blocked.page.$$eval('a.btn', (n) => n.filter((a) => a.getBoundingClientRect().height === 0).length);
    return (hidden === 0 && blocked.errors.length === 0) || `скрытых: ${hidden}, ошибок: ${blocked.errors.join('; ')}`;
  });
  await blocked.ctx.close();
}

const legalOn = process.env.LEGAL === '1' || LEGAL.some((f) => existsSync(path.join(root, f)));
if (legalOn) console.log('юридические страницы');
for (const f of legalOn ? LEGAL : []) {
  if (!existsSync(path.join(root, f))) { bad(f, 'файла нет'); continue; }
  const { page, ctx } = await open(f, 375);
  const t = await page.evaluate(() => document.body.innerText);
  await check(f + ': h1 и реквизиты', async () => ((await page.$('h1')) && t.includes('Лугинова Евгения Романовна')) || 'нет h1 или ФИО');
  await check(f + ': без Людмил и ЮKassa', async () => (!t.includes('Людмил') && !t.includes('ЮKassa')) || 'найдены устаревшие слова');
  await check(f + ': без горизонтальной прокрутки', async () => (await noOverflow(page)) || 'есть прокрутка');
  await ctx.close();
}

await browser.close();
console.log(failed ? `\nПровалено: ${failed}` : '\nВсе проверки пройдены');
process.exit(failed ? 1 : 0);
