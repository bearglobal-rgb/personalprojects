export function initFloatingCta() {
  const banner = document.querySelector('.floating-cta');
  const header = document.querySelector('.site-header');
  const sections = ['founder', 'offers', 'faq', 'final-cta'].map(id => document.getElementById(id));
  let pending = false;

  function update() {
    pending = false;
    if (document.querySelector('#free-system-dialog').open) return;
    // Change state as each section reaches the upper reading area of the viewport.
    const readingLine = header.getBoundingClientRect().bottom + Math.min(160, innerHeight * .2);
    const [founder, offers, questions, final] = sections.map(section => section.getBoundingClientRect().top <= readingLine);
    const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    const visible = founder && !final && !atBottom && (!offers || questions);
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
