const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const base = document.body.dataset.base;
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } },
};
function completed() {
  try {
    const value = JSON.parse(storage.get('core-progress') || '[]');
    return new Set(Array.isArray(value) ? value.filter(n => Number.isInteger(n) && n >= 1 && n <= 24) : []);
  } catch { return new Set(); }
}
function refreshProgress() {
  const done = completed();
  $$('.session-card').forEach(card => {
    const isDone = done.has(Number(card.dataset.session));
    card.classList.toggle('is-complete', isDone);
    card.querySelector('.session-complete').hidden = !isDone;
  });
  $$('[data-complete]').forEach(button => {
    const isDone = done.has(Number(button.dataset.complete));
    button.setAttribute('aria-pressed', String(isDone));
    button.lastChild.textContent = isDone ? ' Session completed' : ' Mark as complete';
  });
  if ($('#course-progress')) {
    $('#course-progress').value = done.size;
    $('#course-progress').textContent = `${done.size} of 24 sessions complete`;
    $('#progress-count').textContent = `${done.size} of 24`;
    $('.journey-progress').hidden = done.size === 0;
    const last = Number(storage.get('core-last-session'));
    const cards = $$('.session-card');
    const next = (last && !done.has(last) ? cards.find(c => Number(c.dataset.session) === last) : null)
      || cards.find(c => !done.has(Number(c.dataset.session)));
    const link = $('#continue-course');
    if (next && (last || done.size)) {
      link.href = next.querySelector('a').href;
      link.firstChild.textContent = `Continue with session ${String(next.dataset.session).padStart(2, '0')} `;
    } else if (!next) {
      link.href = `${base}#sessions`;
      link.firstChild.textContent = 'Revisit the journey ';
    } else {
      link.href = cards[0].querySelector('a').href;
      link.firstChild.textContent = 'Begin the journey ';
    }
  }
}
const current = $('[data-current-session]');
if (current) storage.set('core-last-session', current.dataset.currentSession);
$$('[data-complete]').forEach(button => button.addEventListener('click', () => {
  const done = completed(), number = Number(button.dataset.complete);
  done.has(number) ? done.delete(number) : done.add(number);
  const saved = storage.set('core-progress', JSON.stringify([...done].sort((a,b) => a-b)));
  refreshProgress();
  if ($('#completion-status')) $('#completion-status').textContent = saved
    ? (done.has(number) ? 'Session marked complete. Your progress is saved on this device.' : 'Completion mark removed.')
    : 'This browser could not save progress. You can still read every session.';
}));
refreshProgress();
window.addEventListener('storage', refreshProgress);
window.addEventListener('pageshow', refreshProgress);

const menu = $('.menu-toggle'), nav = $('#site-navigation');
function closeMenu() { if (menu) { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); } }
menu?.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(expanded)); nav.classList.toggle('is-open', expanded);
});
nav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });

const themeButton = $('.theme-toggle');
const themeMedia = matchMedia('(prefers-color-scheme: dark)');
function dark() { return document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && themeMedia.matches); }
function themeLabel() { if (themeButton) { themeButton.setAttribute('aria-pressed', String(dark())); themeButton.setAttribute('aria-label', `Use ${dark() ? 'light' : 'dark'} theme`); } }
themeButton?.addEventListener('click', () => { const value = dark() ? 'light' : 'dark'; document.documentElement.dataset.theme = value; storage.set('core-theme', value); themeLabel(); });
themeMedia.addEventListener('change', themeLabel); themeLabel();
const textButton = $('.text-size');
function textLabel() { textButton?.setAttribute('aria-pressed', String(document.documentElement.dataset.reading === 'large')); }
textButton?.addEventListener('click', () => { const value = document.documentElement.dataset.reading === 'large' ? 'normal' : 'large'; document.documentElement.dataset.reading = value; storage.set('core-text-size', value); textLabel(); });
textLabel();

const search = $('#course-search'), filters = $$('[data-filter]');
let filter = 'all';
function filterSessions() {
  const query = (search?.value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const words = query.split(/\s+/).filter(Boolean); let count = 0;
  $$('.session-card').forEach(card => {
    const haystack = card.dataset.search.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const shown = (filter === 'all' || card.dataset.part === filter) && words.every(word => haystack.includes(word));
    card.hidden = !shown; if (shown) count++;
  });
  $$('[data-group]').forEach(group => { group.hidden = !group.querySelector('.session-card:not([hidden])'); });
  if ($('#search-results')) $('#search-results').textContent = `${count} ${count === 1 ? 'session' : 'sessions'}${query ? ` matching “${search.value.trim()}”` : ' to explore'}`;
  if ($('#empty-state')) $('#empty-state').hidden = count > 0;
  if ($('#clear-search')) $('#clear-search').hidden = !search.value;
}
search?.addEventListener('input', filterSessions);
filters.forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  filters.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  filterSessions();
}));
$('#clear-search')?.addEventListener('click', () => { search.value = ''; filterSessions(); search.focus(); });
$$('a[href^="#part-"]').forEach(link => link.addEventListener('click', () => {
  filter = 'all';
  if (search) search.value = '';
  filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === 'all')));
  filterSessions();
}));
$('#print-sheet')?.addEventListener('click', () => window.print());
$('#reset-progress')?.addEventListener('click', () => {
  const saved = storage.set('core-progress', '[]'); storage.set('core-last-session', ''); refreshProgress();
  $('#privacy-status').textContent = saved ? 'Completion marks cleared on this device.' : 'This browser could not clear saved progress.';
});
$('#export-progress')?.addEventListener('click', () => {
  const data = { course: 'CORE', version: 1, exported: new Date().toISOString(), completedSessions: [...completed()].sort((a,b) => a-b) };
  const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' });
  const objectURL = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = objectURL; a.download = 'core-progress.json'; a.click(); setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
  $('#privacy-status').textContent = 'Progress exported as a personal record. It contains only completion numbers and the export date.';
});

let installPrompt;
const installButton = $('#install-app');
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; if (installButton) installButton.hidden = false; });
installButton?.addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt(); await installPrompt.userChoice;
  installPrompt = null; installButton.hidden = true;
});
window.addEventListener('appinstalled', () => { if (installButton) installButton.hidden = true; if ($('#install-help')) $('#install-help').textContent = 'CORE is installed. Look for it on your home screen or in your apps.'; });

function offlineText(message) { $$('.offline-state, .offline-detail').forEach(el => { el.textContent = message; }); }
if ('serviceWorker' in navigator && window.isSecureContext) {
  const workerURL = new URL('../sw.js', import.meta.url);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) location.reload(); });
  navigator.serviceWorker.register(workerURL, { scope: base }).then(async registration => {
    const update = () => {
      if (!registration.waiting || !navigator.serviceWorker.controller) return;
      $('.update-notice').hidden = false;
      $('#apply-update').onclick = () => { reloading = true; registration.waiting.postMessage({ type: 'SKIP_WAITING' }); };
    };
    update();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed') update();
        if (worker.state === 'redundant') offlineText('Offline preparation failed. Reconnect and reload to try again.');
      });
    });
    await navigator.serviceWorker.ready;
    offlineText('Course ready offline');
  }).catch(() => offlineText('Offline reading unavailable in this browser. You can download learner PDFs.'));
} else offlineText('Offline reading needs a supported browser and a secure connection.');
$('#dismiss-update')?.addEventListener('click', () => { $('.update-notice').hidden = true; });
