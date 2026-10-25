import { initFreeSystemSignup } from './free-system-signup.js';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const system = document.querySelector('[data-timeline="system"]');
const origin = document.querySelector('[data-timeline="origin"]');
const originChapters = Array.from(origin.querySelectorAll('.origin-chapter'));
const compactOrigin = window.matchMedia('(max-width: 1023px)');
const protocols = Array.from(system.querySelectorAll(':scope > ol > li'));
const phaseLinks = Array.from(document.querySelectorAll('.phase-link'));
const phases = [0, 3, 5, 6, 8];
const compactSystem = window.matchMedia('(max-width: 1023px)');
const phaseLabels = protocols.map(item => item.querySelector('.step-phase-label'));
let activeIndex = null;
let activePhase = null;
// A return to the mobile phase list is a selection, not a reading position.
let returnedPhase = null;
let framePending = false;

function setActive(index, phase = phases.findLastIndex(start => index >= start)) {
  if (index === activeIndex && phase === activePhase) return;
  activeIndex = index;
  activePhase = phase;
  protocols.forEach((item, i) => {
    const active = i === index;
    item.dataset.active = String(active);
    const button = item.querySelector('button');
    if (active) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
    phaseLabels[i].disabled = !compactSystem.matches || !active;
  });
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
  const originInset = compactOrigin.matches ? 16 : 32;
  updateTimeline(origin, originInset, activationY);
  originChapters.forEach(chapter => {
    chapter.dataset.reached = String(chapter.getBoundingClientRect().top + originInset <= activationY);
  });

  let nearest = 0;
  let shortest = Infinity;
  protocols.forEach((item, index) => {
    const card = item.querySelector('article').getBoundingClientRect();
    const distance = Math.abs(card.top + card.height / 2 - activationY);
    if (distance < shortest) { shortest = distance; nearest = index; }
  });
  if (returnedPhase !== null) setActive(-1, returnedPhase);
  else setActive(nearest);
}

function scheduleUpdate() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(update);
}

function showProtocol(index) {
  returnedPhase = null;
  setActive(index);
  const card = protocols[index].querySelector('article').getBoundingClientRect();
  window.scrollTo({
    top: scrollY + card.top + card.height / 2 - innerHeight / 2,
    behavior: reduceMotion.matches ? 'instant' : 'smooth',
  });
}

phaseLinks.forEach((link, phase) => {
  link.id = `system-phase-${phase + 1}`;
  link.addEventListener('click', event => {
    event.preventDefault();
    showProtocol(phases[phase]);
    if (compactSystem.matches) protocols[phases[phase]].querySelector('button').focus({ preventScroll: true });
  });
});

protocols.forEach((item, index) => {
  const button = item.querySelector('button');
  const card = item.querySelector('article');
  button.setAttribute('aria-label', `Step ${index + 1}: ${card.querySelector('h3').textContent}`);
  button.addEventListener('click', () => showProtocol(index));
  const phase = phases.findLastIndex(start => index >= start);
  const label = phaseLabels[index];
  label.setAttribute('aria-label', `Back to ${label.textContent} in the phase list`);
  label.setAttribute('aria-controls', phaseLinks[phase].id);
  label.addEventListener('click', () => {
    if (!compactSystem.matches || index !== activeIndex) return;
    returnedPhase = phase;
    setActive(-1, phase);
    const link = phaseLinks[phase];
    const nav = link.parentElement.getBoundingClientRect();
    const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
    // Show the whole list where possible; keep the selected row visible on short screens.
    const offset = Math.max(nav.top - headerBottom - 20, link.getBoundingClientRect().bottom - innerHeight + 20);
    link.focus({ preventScroll: true });
    window.scrollTo({ top: scrollY + offset, behavior: reduceMotion.matches ? 'instant' : 'smooth' });
  });
});

function resumeSystemReading() {
  if (returnedPhase === null) return;
  returnedPhase = null;
  // Stop an unfinished return animation before the visitor takes over scrolling.
  window.scrollTo({ top: scrollY, behavior: 'instant' });
  scheduleUpdate();
}

// Programmatic scrolling and Safari viewport changes must not release the selection.
let touchStart = null;
window.addEventListener('touchstart', event => {
  const touch = event.touches[0];
  touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
}, { passive: true });
window.addEventListener('touchmove', event => {
  if (!touchStart || !event.touches[0]) return;
  const dx = event.touches[0].clientX - touchStart.x;
  const dy = event.touches[0].clientY - touchStart.y;
  if (Math.abs(dy) > 6 && Math.abs(dy) > Math.abs(dx)) resumeSystemReading();
}, { passive: true });
window.addEventListener('wheel', event => {
  if (event.deltaY && !event.ctrlKey) resumeSystemReading();
}, { passive: true });
window.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target.closest('input, textarea, select, button, [contenteditable="true"]')) return;
  if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) resumeSystemReading();
});
compactSystem.addEventListener('change', () => {
  returnedPhase = null;
  activeIndex = null;
  scheduleUpdate();
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

const rooms = document.querySelector('.rooms-carousel');
const roomCards = Array.from(rooms.children);
const roomControls = document.querySelector('.rooms-controls');
const roomDots = Array.from(roomControls.querySelectorAll('[data-rooms-slide]'));
const previousRoom = roomControls.querySelector('[data-rooms-prev]');
const nextRoom = roomControls.querySelector('[data-rooms-next]');
const compactRooms = window.matchMedia('(max-width: 1023px)');
let currentRoom = 0;
let roomFramePending = false;

function updateRoomControls() {
  roomFramePending = false;
  const maxScroll = rooms.scrollWidth - rooms.clientWidth;
  const trackLeft = rooms.getBoundingClientRect().left;
  currentRoom = maxScroll > 0 && rooms.scrollLeft >= maxScroll - 1
    ? roomCards.length - 1
    : roomCards.reduce((nearest, card, index) =>
      Math.abs(card.getBoundingClientRect().left - trackLeft) <
      Math.abs(roomCards[nearest].getBoundingClientRect().left - trackLeft) ? index : nearest, 0);
  roomDots.forEach((dot, index) => {
    if (index === currentRoom) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });
  previousRoom.disabled = currentRoom === 0;
  nextRoom.disabled = currentRoom === roomCards.length - 1;
}

function scheduleRoomUpdate() {
  if (roomFramePending) return;
  roomFramePending = true;
  requestAnimationFrame(updateRoomControls);
}

function showRoom(index) {
  const target = roomCards[clamp(index, 0, roomCards.length - 1)];
  rooms.scrollTo({
    left: target.offsetLeft - roomCards[0].offsetLeft,
    behavior: reduceMotion.matches ? 'instant' : 'smooth',
  });
}

function syncRoomLayout() {
  roomControls.hidden = !compactRooms.matches;
  if (compactRooms.matches) {
    rooms.tabIndex = 0;
    rooms.setAttribute('role', 'region');
    rooms.setAttribute('aria-roledescription', 'carousel');
  } else {
    rooms.removeAttribute('tabindex');
    rooms.removeAttribute('role');
    rooms.removeAttribute('aria-roledescription');
    rooms.scrollLeft = 0;
  }
  scheduleRoomUpdate();
}

previousRoom.addEventListener('click', () => showRoom(currentRoom - 1));
nextRoom.addEventListener('click', () => showRoom(currentRoom + 1));
roomDots.forEach((dot, index) => dot.addEventListener('click', () => showRoom(index)));
rooms.addEventListener('scroll', scheduleRoomUpdate, { passive: true });
rooms.addEventListener('keydown', event => {
  if (!compactRooms.matches || event.target !== rooms) return;
  const destinations = { ArrowLeft: currentRoom - 1, ArrowRight: currentRoom + 1, Home: 0, End: roomCards.length - 1 };
  if (!(event.key in destinations)) return;
  event.preventDefault();
  showRoom(destinations[event.key]);
});
compactRooms.addEventListener('change', syncRoomLayout);
new ResizeObserver(scheduleRoomUpdate).observe(rooms);
syncRoomLayout();
initFreeSystemSignup({ beforeOpen: () => closeMenu() });
