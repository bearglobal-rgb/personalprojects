import { getPageScrollTop, getPageScrollHeight, pageScroller } from './page-scroll.js';
export function initFloatingCta() {
  const banner = document.querySelector('.floating-cta');
  const header = document.querySelector('.site-header');
  const offersSection = document.getElementById('offers');
  const finalSection = document.getElementById('final-cta');
  const heroButtons = [...document.querySelectorAll('#top [data-free-system], #top [data-black-application]')];
  const offerButtons = [...offersSection.querySelectorAll('[data-free-system], [data-black-application]')];
  const finalButtons = [...finalSection.querySelectorAll('[data-free-system], [data-black-application]')];
  let pending = false;

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
    banner.dataset.visible = String(visible);
    banner.inert = !visible;
    banner.setAttribute('aria-hidden', String(!visible));
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
