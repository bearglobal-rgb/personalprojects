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
    const readingLine = headerBottom + Math.min(160, innerHeight * .2);
    // Wait until 80% of each button has passed behind the sticky header.
    // This also handles stacked buttons and offer cards on phones.
    const buttonsPassed = buttons => buttons.every(button => {
      const rect = button.getBoundingClientRect();
      return rect.top + rect.height * .8 <= headerBottom;
    });
    const offers = offersSection.getBoundingClientRect().top <= readingLine;
    // Use the resting banner edge, so its exit animation cannot change the trigger.
    const bannerBottom = innerHeight - parseFloat(getComputedStyle(banner).bottom);
    const final = innerWidth < 640
      ? finalSection.getBoundingClientRect().top <= readingLine
      : finalButtons.some(button => button.getBoundingClientRect().top <= bannerBottom);
    const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
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

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  new ResizeObserver(schedule).observe(document.querySelector('main'));
  document.fonts.ready.then(schedule);
  update();
}
