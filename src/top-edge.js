const content = document.querySelector('main');
const header = document.querySelector('.site-header');
let pending = false;

function updateTopEdge() {
  pending = false;
  // The fade is fully opaque here. Clip the source content too, so Safari cannot
  // paint it again above a fixed overlay when the browser chrome changes height.
  // The opaque edge is 25px above the panel's bottom, including its 1px border.
  // Refer to the bottom so extending the mobile glass into the safe area does
  // not move the clipping boundary or the monogram.
  const opaqueEdge = header.getBoundingClientRect().bottom - 25;
  const rect = content.getBoundingClientRect();
  const clip = Math.min(rect.height, Math.max(0, opaqueEdge - rect.top));
  content.style.setProperty('--top-content-clip', `${clip}px`);
}

function scheduleTopEdge() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(updateTopEdge);
}

window.addEventListener('scroll', scheduleTopEdge, { passive: true });
window.addEventListener('resize', scheduleTopEdge);
window.addEventListener('pageshow', scheduleTopEdge);
window.visualViewport?.addEventListener('resize', scheduleTopEdge);
window.visualViewport?.addEventListener('scroll', scheduleTopEdge);
const topEdgeResizeObserver = new ResizeObserver(scheduleTopEdge);
topEdgeResizeObserver.observe(content);
topEdgeResizeObserver.observe(header);
document.fonts.ready.then(scheduleTopEdge);
updateTopEdge();
