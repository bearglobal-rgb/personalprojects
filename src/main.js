const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const system = document.querySelector('[data-timeline="system"]');
const origin = document.querySelector('[data-timeline="origin"]');
const protocols = Array.from(system.querySelectorAll(':scope > ol > li'));
const phaseLinks = Array.from(document.querySelectorAll('.phase-link'));
const phases = [0, 3, 5, 6, 8];
let activeIndex = -1;
let framePending = false;

function setActive(index) {
  if (index === activeIndex) return;
  activeIndex = index;
  protocols.forEach((item, i) => {
    const active = i === index;
    item.dataset.active = String(active);
    const button = item.querySelector('button');
    if (active) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  const phase = phases.findLastIndex((start) => index >= start);
  phaseLinks.forEach((link, i) => {
    if (i === phase) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
}

function updateTimeline(container, inset, activationY) {
  const rect = container.getBoundingClientRect();
  const progress = clamp((activationY - rect.top - inset) / Math.max(1, rect.height - inset * 2));
  container.querySelector('[data-progress]').style.transform = `scaleY(${progress})`;
  container.dataset.progress = progress.toFixed(4);
}

function update() {
  framePending = false;
  const activationY = window.innerHeight * .5;
  updateTimeline(system, 16, activationY);
  updateTimeline(origin, 32, activationY);

  let nearest = 0;
  let shortest = Infinity;
  protocols.forEach((item, index) => {
    const card = item.querySelector('article').getBoundingClientRect();
    const distance = Math.abs(card.top + card.height / 2 - activationY);
    if (distance < shortest) { shortest = distance; nearest = index; }
  });
  setActive(nearest);
}

function scheduleUpdate() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(update);
}

protocols.forEach((item, index) => {
  const button = item.querySelector('button');
  const card = item.querySelector('article');
  button.setAttribute('aria-label', `Step ${index + 1}: ${card.querySelector('h3').textContent}`);
  button.addEventListener('click', () => {
    card.scrollIntoView({ behavior: reduceMotion.matches ? 'instant' : 'smooth', block: 'center' });
  });
});

window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);
window.addEventListener('pageshow', scheduleUpdate);
document.fonts.ready.then(scheduleUpdate);
const resizeObserver = new ResizeObserver(scheduleUpdate);
resizeObserver.observe(system);
resizeObserver.observe(origin);
update();

const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
function closeMenu(returnFocus = false) {
  mobileMenu.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  if (returnFocus) menuToggle.focus();
}
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') !== 'true';
  mobileMenu.hidden = !expanded;
  menuToggle.setAttribute('aria-expanded', String(expanded));
  menuToggle.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
});
mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileMenu.hidden) closeMenu(true);
});
window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
  if (event.matches) closeMenu();
});
