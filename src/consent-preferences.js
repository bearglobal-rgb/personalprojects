// A local preference record, not permission for any future tracking service.
// No analytics or advertising code is installed on this website.
const STORAGE_KEY = 'swan-academy:consent:v1';
const form = document.querySelector('#consent-form');
const save = document.querySelector('#consent-save');
const reset = document.querySelector('#consent-reset');
const status = document.querySelector('#consent-status');
const defaultMessage = 'Essential-only browsing is active. No optional analytics or advertising tools are in use.';

function refresh() {
  save.disabled = false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    reset.disabled = raw === null;
    let record;
    try { record = JSON.parse(raw); } catch { /* An invalid record never grants consent. */ }
    const valid = record?.version === 1 && record.essential === true
      && record.analytics === false && record.advertising === false
      && typeof record.savedAt === 'string' && Number.isFinite(Date.parse(record.savedAt));
    status.textContent = valid
      ? 'Your essential-only preference is saved on this browser. Optional analytics and advertising remain off.'
      : defaultMessage;
  } catch {
    reset.disabled = true;
    status.textContent = 'Browser storage is unavailable. Essential-only browsing is still active; no optional analytics or advertising tools are in use.';
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      essential: true,
      analytics: false,
      advertising: false,
      savedAt: new Date().toISOString(),
    }));
    refresh();
  } catch {
    status.textContent = 'Your preference could not be saved because browser storage is unavailable. Essential-only browsing remains active.';
  }
});

reset.addEventListener('click', () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    refresh();
    status.textContent = 'Your saved preference was removed from this browser. Essential-only browsing remains active.';
  } catch {
    status.textContent = 'Your saved preference could not be removed because browser storage is unavailable. Optional analytics and advertising remain off.';
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY || event.key === null) refresh();
});
refresh();
