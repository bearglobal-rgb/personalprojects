const viewport = document.querySelector('.page-viewport');
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Keep iOS momentum scrolling inside a compositor-clipped viewport. Nothing in
// the document itself scrolls beneath Safari's status bar, even between frames.
export const containedScroll = Boolean(isIOS && viewport);
if (containedScroll) document.documentElement.classList.add('contained-scroll');
export const pageScroller = containedScroll ? viewport : window;
export const getPageScrollTop = () => containedScroll ? viewport.scrollTop : window.scrollY;
export const getPageScrollHeight = () => containedScroll ? viewport.scrollHeight : document.documentElement.scrollHeight;
export const scrollPageTo = (...args) => pageScroller.scrollTo(...args);

// On reload the browser restores the document, while iOS scrolls this inner element.
function rememberViewportOnReload() {
  const key = `swan:scroll:${location.pathname}`;
  function savePosition() {
    const max = viewport.scrollHeight - viewport.clientHeight;
    const top = Math.max(0, viewport.scrollTop);
    try {
      sessionStorage.setItem(key, max > 0 && top >= max - 1 ? 'bottom' : String(top));
    } catch { /* Storage can be unavailable in restricted sessions. */ }
  }

  window.addEventListener('pagehide', savePosition);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') savePosition();
  });

  const navigation = performance.getEntriesByType('navigation')[0];
  const reloaded = navigation ? navigation.type === 'reload' : performance.navigation?.type === 1;
  if (!reloaded) return;
  let saved;
  try { saved = sessionStorage.getItem(key); } catch { return; }
  if (saved === null || (saved !== 'bottom' && !Number.isFinite(Number(saved)))) return;

  function restore() {
    viewport.scrollTo({ top: saved === 'bottom' ? viewport.scrollHeight : Number(saved), behavior: 'instant' });
  }
  restore();
  // Fonts and fragment navigation can shift the first layout. Let new input take precedence.
  const pending = new AbortController();
  for (const type of ['pointerdown', 'wheel', 'keydown']) {
    window.addEventListener(type, () => pending.abort(), { passive: true, capture: true, signal: pending.signal });
  }
  window.addEventListener('pageshow', async () => {
    await document.fonts.ready;
    if (!pending.signal.aborted) restore();
    pending.abort();
  }, { once: true });
}

if (containedScroll) rememberViewportOnReload();

export function lockPageScroll() {
  if (containedScroll) {
    const previous = viewport.style.overflowY;
    viewport.style.overflowY = 'hidden';
    return () => { viewport.style.overflowY = previous; };
  }
  const previous = document.body.getAttribute('style');
  Object.assign(document.body.style, { position: 'fixed', top: `-${window.scrollY}px`, width: '100%' });
  return () => {
    if (previous === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', previous);
  };
}
