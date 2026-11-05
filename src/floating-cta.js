import { getPageScrollTop, getPageScrollHeight, pageScroller } from './page-scroll.js';
export function initFloatingCta() {
  const banner = document.querySelector('.floating-cta');
  const header = document.querySelector('.site-header');
  const offersSection = document.getElementById('offers');
  const finalSection = document.getElementById('final-cta');
  const heroButtons = [...document.querySelectorAll('#top [data-free-system], #top [data-black-application]')];
  const offerButtons = [...offersSection.querySelectorAll('[data-free-system], [data-black-application]')];
  const finalButtons = [...finalSection.querySelectorAll('[data-free-system], [data-black-application]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pending = false;
  let exitTimer;

  function finishExit() {
    if (banner.dataset.visible === 'false') banner.removeAttribute('data-rendered');
    clearTimeout(exitTimer);
  }

  function setVisible(visible) {
    if (banner.dataset.visible === String(visible)) return;
    clearTimeout(exitTimer);
    if (visible) banner.dataset.rendered = 'true';
    banner.dataset.visible = String(visible);
    banner.inert = !visible;
    banner.setAttribute('aria-hidden', String(!visible));
    if (!visible) {
      if (reducedMotion.matches) finishExit();
      else {
        // Keep painting the glass until its transform finishes. A delayed
        // visibility transition can cut the exit short in mobile browsers.
        const cssDuration = getComputedStyle(banner).getPropertyValue('--floating-cta-duration').trim();
        const duration = parseFloat(cssDuration) * (cssDuration.endsWith('ms') ? 1 : 1000);
        exitTimer = setTimeout(finishExit, duration + 80);
      }
    }
  }

  banner.addEventListener('transitionend', event => {
    if (event.target === banner && event.propertyName === 'transform'
      && banner.getBoundingClientRect().top >= innerHeight) finishExit();
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) finishExit();
  });

  function update() {
    pending = false;
    if (document.querySelector('#free-system-dialog').open) return;
    const headerBottom = header.getBoundingClientRect().bottom;
    // Wait until 80% of each button has passed behind the sticky header.
    // This also handles stacked buttons and offer cards on phones.
    const buttonsPassed = buttons => buttons.every(button => {
      const rect = button.getBoundingClientRect();
      return rect.top + rect.height * .8 <= headerBottom;
    });
    // Use the resting banner edge, so its exit animation cannot change the trigger.
    const bannerBottom = innerHeight - parseFloat(getComputedStyle(banner).bottom);
    // Treat subpixel rounding at the shared edge as contact too.
    const buttonsReachBanner = buttons => buttons.some(button => button.getBoundingClientRect().top <= bannerBottom + 1);
    // Use the same contact rule for both CTA sections. Keep stacked offer
    // buttons clear until the last one has passed 80% behind the header.
    const offers = buttonsReachBanner(offerButtons);
    const final = buttonsReachBanner(finalButtons);
    const atBottom = getPageScrollTop() + innerHeight >= getPageScrollHeight() - 2;
    const visible = buttonsPassed(heroButtons) && !final && !atBottom && (!offers || buttonsPassed(offerButtons));
    setVisible(visible);
  }

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(update);
  }

  pageScroller.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  new ResizeObserver(schedule).observe(document.querySelector('main'));
  document.fonts.ready.then(schedule);
  update();
}
