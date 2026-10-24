// The signup UI stays in preview until a real email-delivery integration is supplied.
// Never collect an address or claim delivery while that connection is missing.
export function initFreeSystemSignup({ beforeOpen = () => {} } = {}) {
  const dialog = document.querySelector('#free-system-dialog');
  const form = dialog.querySelector('form');
  let opener;
  let savedScrollY = 0;
  let savedBodyStyle;

  document.querySelectorAll('[data-free-system]').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      beforeOpen();
      savedScrollY = window.scrollY;
      savedBodyStyle = document.body.getAttribute('style');
      Object.assign(document.body.style, { position: 'fixed', top: `-${savedScrollY}px`, width: '100%' });
      dialog.showModal();
    });
  });
  dialog.querySelector('.signup-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const r = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (savedBodyStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', savedBodyStyle);
    window.scrollTo({ top: savedScrollY, behavior: 'instant' });
    const focusTarget = opener?.getClientRects().length ? opener : document.querySelector('.menu-toggle');
    focusTarget?.focus({ preventScroll: true });
    form.reset();
  });
  form.addEventListener('submit', event => event.preventDefault());
}
