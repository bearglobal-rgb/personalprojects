import { getPageScrollTop, scrollPageTo, lockPageScroll } from './page-scroll.js';
// The signup UI stays in preview until a real email-delivery integration is supplied.
// Never collect an address or claim delivery while that connection is missing.
export function initFreeSystemSignup({ beforeOpen = () => {} } = {}) {
  const dialog = document.querySelector('#free-system-dialog');
  const form = dialog.querySelector('form');
  let opener;
  let savedScrollY = 0;
  let unlockScroll;

  document.querySelectorAll('[data-free-system]').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      beforeOpen();
      savedScrollY = getPageScrollTop();
      unlockScroll = lockPageScroll();
      dialog.showModal();
    });
  });
  dialog.querySelector('.signup-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const r = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    unlockScroll();
    scrollPageTo({ top: savedScrollY, behavior: 'instant' });
    const focusTarget = opener?.getClientRects().length ? opener : document.querySelector('.site-header .brand');
    focusTarget?.focus({ preventScroll: true });
    form.reset();
  });
  form.addEventListener('submit', event => event.preventDefault());
}
