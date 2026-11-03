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
